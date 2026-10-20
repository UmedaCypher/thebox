// supabase/functions/create-portal-session/index.ts
//
// Ouvre l'espace client Stripe : changer de carte, voir les factures, résilier.
// Secrets : STRIPE_SECRET_KEY, SITE_URL (voir create-checkout-session).

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

    const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Connectez-vous pour gérer votre abonnement.' }, 401);

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (!sub?.stripe_customer_id) return json({ error: "Aucun abonnement n'est associé à ce compte." }, 404);

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      locale: 'fr',
      return_url: `${env('SITE_URL').replace(/\/$/, '')}/profil`,
    });
    return json({ url: portal.url });
  } catch (e) {
    console.error('create-portal-session', e);
    return json({ error: "L'espace abonnement est indisponible pour le moment." }, 500);
  }
});
