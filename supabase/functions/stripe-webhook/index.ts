// supabase/functions/stripe-webhook/index.ts
//
// Reçoit les événements Stripe et tient à jour l'abonnement et l'offre (profiles.plan).
// C'est la seule source de vérité : l'app ne passe jamais un compte en Premium elle-même.
//
// Cette fonction est appelée par Stripe, pas par l'app : la vérification du jeton Supabase
// doit être DÉSACTIVÉE (verify_jwt = false). La sécurité vient de la signature Stripe.
//
// Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_…, donné par Stripe à la création du webhook).
// Événements à cocher dans Stripe :
//   checkout.session.completed, customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted

import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Secret manquant : ${k}`);
  return v;
};

const stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

/** Statuts Stripe qui donnent accès à Premium. past_due : paiement en retard, on laisse le temps de régulariser. */
const PREMIUM_STATUSES = new Set(['active', 'trialing', 'past_due']);

async function userIdFor(sub: Stripe.Subscription): Promise<string | null> {
  const fromMeta = sub.metadata?.supabase_user_id;
  if (fromMeta) return fromMeta;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const { data } = await admin.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
  return (data?.user_id as string) ?? null;
}

async function syncSubscription(received: Stripe.Subscription) {
  // Les événements peuvent arriver dans le désordre : on relit l'état actuel chez Stripe.
  const sub = await stripe.subscriptions.retrieve(received.id);
  if (!sub.metadata?.supabase_user_id && received.metadata?.supabase_user_id) sub.metadata = received.metadata;
  const userId = await userIdFor(sub);
  if (!userId) {
    console.warn('Abonnement sans utilisateur connu', sub.id);
    return;
  }
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const { error: subError } = await admin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: sub.items.data[0]?.price.id ?? null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (subError) throw subError;

  const plan = PREMIUM_STATUSES.has(sub.status) ? 'premium' : 'free';
  const { error: planError } = await admin.from('profiles').update({ plan }).eq('id', userId);
  if (planError) throw planError;
  console.log(`Utilisateur ${userId} : abonnement ${sub.status}, offre ${plan}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('Signature manquante', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env('STRIPE_WEBHOOK_SECRET'), undefined, cryptoProvider);
  } catch (e) {
    console.error('Signature invalide', e);
    return new Response('Signature invalide', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          if (!sub.metadata?.supabase_user_id && session.client_reference_id) {
            sub.metadata = { ...sub.metadata, supabase_user_id: session.client_reference_id };
          }
          await syncSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        // Événement non utilisé : on répond OK pour que Stripe ne le renvoie pas.
        break;
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(`Erreur sur ${event.type}`, e);
    // 500 : Stripe réessaiera automatiquement.
    return new Response('Erreur de traitement', { status: 500 });
  }
});
