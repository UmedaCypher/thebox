// supabase/functions/create-checkout-session/index.ts
//
// Ouvre une page de paiement Stripe Checkout pour l'abonnement Premium.
// Appelée par l'app avec la session de l'utilisateur connecté (jeton JWT).
//
// Secrets nécessaires (Supabase → Edge Functions → Secrets) :
//   STRIPE_SECRET_KEY  clé secrète Stripe (sk_test_… puis sk_live_…)
//   STRIPE_PRICE_ID    identifiant du prix annuel (price_…)
//   SITE_URL           adresse publique de l'app, sans / final (ex. https://thebox.app)
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: env('STRIPE_PRICE_ID'), quantity: 1 }],
      subscription_data: { metadata: { supabase_user_id: user.id } },
      metadata: { supabase_user_id: user.id },
      allow_promotion_codes: true,
      locale: 'fr',
      success_url: `${siteUrl}/premium?paiement=ok`,
      cancel_url: `${siteUrl}/premium?paiement=annule`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session', e);
    return json({ error: 'Le paiement est indisponible pour le moment. Réessayez dans quelques minutes.' }, 500);
  }
});
