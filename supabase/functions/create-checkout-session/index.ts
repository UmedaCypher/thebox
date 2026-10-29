// supabase/functions/create-checkout-session/index.ts
//
// Ouvre une page de paiement Stripe Checkout pour l'abonnement Premium.
// Appelée par l'app avec la session de l'utilisateur connecté (jeton JWT).
//
// Secrets nécessaires (Supabase → Edge Functions → Secrets) :
//   STRIPE_SECRET_KEY  clé secrète Stripe (sk_test_… puis sk_live_…)
//   STRIPE_PRICE_MONTHLY  identifiant du prix mensuel (price_…, 3 €/mois)
//   STRIPE_PRICE_YEARLY   identifiant du prix annuel (price_…, 30 €/an)
//   SITE_URL           adresse publique de l'app, sans / final (ex. https://thebox.app)
// Facultatifs :
//   STRIPE_TAX_RATE      taux de TVA Stripe (txr_…, « TVA 20 % incluse ») ajouté à l'abonnement et aux factures
//   STRIPE_TERMS_CONSENT « on » pour faire cocher les CGV sur la page de paiement
//                        (renseigner d'abord l'adresse des CGV dans Stripe → Paramètres → Informations publiques)
//
// Affiliation : l'app peut envoyer `ref` (code d'un affilié, mémorisé quand le visiteur est arrivé par son lien).
// Il n'est retenu que pour l'abonnement annuel, un premier abonnement, un affilié actif et différent de l'acheteur.
// L'affilié est alors inscrit dans les métadonnées de l'abonnement ; le webhook calcule la commission.
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Secret manquant : ${k}`);
  return v;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  try {
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });
    const siteUrl = env('SITE_URL').replace(/\/$/, '');

    // Qui appelle ? On lit l'utilisateur depuis son jeton, jamais depuis le corps de la requête.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Connectez-vous pour passer à Premium.' }, 401);

    // Formule choisie : uniquement 'month' ou 'year' (l'app n'envoie jamais d'identifiant de prix)
    const body = await req.json().catch(() => ({}));
    const interval = body?.interval === 'month' ? 'month' : 'year';
    const priceId = env(interval === 'month' ? 'STRIPE_PRICE_MONTHLY' : 'STRIPE_PRICE_YEARLY');

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).maybeSingle();
    if (profile?.plan === 'premium') return json({ error: 'Votre compte est déjà Premium.' }, 409);

    // Un client Stripe par utilisateur, réutilisé d'un paiement à l'autre.
    const { data: existing } = await admin
      .from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

    let customerId = existing?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin.from('subscriptions').upsert(
        { user_id: user.id, stripe_customer_id: customerId, status: 'incomplete', updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
    }

    // Parrainage : uniquement l'annuel, uniquement un premier abonnement, jamais soi-même.
    let affiliateId: string | null = null;
    const ref = typeof body?.ref === 'string' ? body.ref.trim().toLowerCase().slice(0, 30) : '';
    if (ref && interval === 'year' && /^[a-z0-9][a-z0-9._-]{2,29}$/.test(ref)) {
      const { data: aff } = await admin.from('affiliates').select('user_id').eq('code', ref).eq('status', 'active').maybeSingle();
      if (aff && aff.user_id !== user.id) {
        const earlier = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
        if (!earlier.data.length) affiliateId = aff.user_id as string;
      }
    }

    const taxRate = Deno.env.get('STRIPE_TAX_RATE');
    const termsConsent = Deno.env.get('STRIPE_TERMS_CONSENT') === 'on';
    const en = body?.lang === 'en';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1, ...(taxRate ? { tax_rates: [taxRate] } : {}) }],
      subscription_data: {
        metadata: { supabase_user_id: user.id, ...(affiliateId ? { affiliate_id: affiliateId, affiliate_code: ref } : {}) },
        ...(taxRate ? { default_tax_rates: [taxRate] } : {}),
      },
      metadata: { supabase_user_id: user.id },
      allow_promotion_codes: true,
      locale: en ? 'en' : 'fr',
      ...(termsConsent ? {
        consent_collection: { terms_of_service: 'required' as const },
        custom_text: {
          terms_of_service_acceptance: {
            message: en
              ? `I accept the [terms of sale](${siteUrl}/cgv) and ask for Premium to start right away. I keep my 14-day right of withdrawal, with a pro-rata refund.`
              : `J'accepte les [conditions générales de vente](${siteUrl}/cgv) et demande l'accès immédiat à Premium. Je garde mon droit de rétractation de 14 jours, avec un remboursement au prorata.`,
          },
        },
      } : {}),
      success_url: `${siteUrl}/premium?paiement=ok`,
      cancel_url: `${siteUrl}/premium?paiement=annule`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session', e);
    return json({ error: 'Le paiement est indisponible pour le moment. Réessayez dans quelques minutes.' }, 500);
  }
});
