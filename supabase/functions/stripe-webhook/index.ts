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
//   customer.subscription.updated, customer.subscription.deleted,
//   invoice.paid, charge.refunded, charge.dispute.created   (programme d'affiliation)

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

// ---------- Affiliation ----------
/** Part reversée à l'affilié, sur le montant hors taxes. */
const COMMISSION_RATE = 0.3;
/** Délai avant qu'une commission soit payable : après les 14 jours de rétractation, avec de la marge. */
const HOLD_DAYS = 30;
const YEAR_MS = 365 * 24 * 3600 * 1000;
const idOf = (x: string | { id: string } | null | undefined) => (x == null ? null : typeof x === 'string' ? x : x.id);

/** Facture payée d'un abonnement parrainé : 30 % du HT pour les factures annuelles de la première année. */
async function recordCommission(invoice: Stripe.Invoice) {
  const subId = idOf(invoice.subscription as string | Stripe.Subscription | null);
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  const affiliateId = sub.metadata?.affiliate_id;
  if (!affiliateId) return;
  const userId = await userIdFor(sub);
  if (!userId || userId === affiliateId) return;

  // Le parrainage est noté une fois, au premier paiement.
  const { error: refError } = await admin.from('affiliate_referrals').upsert(
    { referred_user_id: userId, affiliate_id: affiliateId, stripe_subscription_id: sub.id },
    { onConflict: 'referred_user_id', ignoreDuplicates: true },
  );
  if (refError) throw refError;

  const paidAt = (invoice.status_transitions?.paid_at ?? invoice.created) * 1000;
  if (paidAt - sub.start_date * 1000 > YEAR_MS) return; // au-delà de la première année
  const yearly = invoice.lines.data.some(l => l.price?.recurring?.interval === 'year');
  if (!yearly) return; // seuls les abonnements annuels sont commissionnés
  const base = invoice.total_excluding_tax ?? invoice.subtotal;
  const amount = Math.round(base * COMMISSION_RATE);
  if (amount <= 0) return;

  const { error } = await admin.from('affiliate_commissions').upsert({
    affiliate_id: affiliateId,
    referred_user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_charge_id: idOf(invoice.charge as string | Stripe.Charge | null),
    amount_cents: amount,
    currency: invoice.currency,
    available_at: new Date(paidAt + HOLD_DAYS * 24 * 3600 * 1000).toISOString(),
  }, { onConflict: 'stripe_invoice_id', ignoreDuplicates: true });
  if (error) throw error;
  console.log(`Commission de ${amount} centimes pour l'affilié ${affiliateId} (facture ${invoice.id})`);
}

/** Remboursement ou litige : la commission non versée est annulée. Une commission déjà versée est signalée dans les logs. */
async function cancelCommission(chargeId: string | null, reason: string) {
  if (!chargeId) return;
  const { data, error } = await admin.from('affiliate_commissions')
    .update({ status: 'cancelled', cancel_reason: reason })
    .eq('stripe_charge_id', chargeId).eq('status', 'pending')
    .select('id');
  if (error) throw error;
  if (data?.length) console.log(`Commission annulée (${reason}) pour le paiement ${chargeId}`);
  const { data: paid } = await admin.from('affiliate_commissions').select('id, affiliate_id, amount_cents')
    .eq('stripe_charge_id', chargeId).eq('status', 'paid');
  for (const c of paid ?? []) console.warn(`À régulariser : commission ${c.id} déjà versée (${c.amount_cents} centimes) à ${c.affiliate_id}, ${reason}`);
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
      case 'invoice.paid':
        await recordCommission(event.data.object as Stripe.Invoice);
        break;
      case 'charge.refunded':
        await cancelCommission((event.data.object as Stripe.Charge).id, 'remboursement');
        break;
      case 'charge.dispute.created':
        await cancelCommission(idOf((event.data.object as Stripe.Dispute).charge), 'litige');
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
