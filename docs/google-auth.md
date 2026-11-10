# Connexion avec Google

Le bouton « Continuer avec Google » apparaît sur les pages de connexion et d'inscription
quand la variable de build `VITE_GOOGLE_AUTH=true` est définie (Cloudflare → Worker → Settings → Build → Variables).
Ne l'activez qu'une fois les étapes ci-dessous terminées.

## 1. Google Cloud (identifiants OAuth)

1. https://console.cloud.google.com → créer un projet « Arcora » (ou réutiliser celui du Play Store).
2. **APIs et services → Écran de consentement OAuth** : type **Externe**, nom « Arcora », e-mail d'assistance
   contact@arcorawatch.com, logo, domaine autorisé `arcorawatch.com`, liens vers `/confidentialite` et `/cgu`.
   Portées : `email`, `profile`, `openid` (rien d'autre). Publier l'application (statut « En production »).
3. **Identifiants → Créer des identifiants → ID client OAuth** : type **Application Web**.
   - Origines JavaScript autorisées : `https://arcorawatch.com`
   - URI de redirection autorisés : `https://gwotvurtiyeaslmxnqcw.supabase.co/auth/v1/callback`
4. Copier l'**ID client** et le **code secret**.

## 2. Supabase

1. **Authentication → Sign In / Providers → Google** : activer, coller l'ID client et le secret, enregistrer.
2. **Authentication → URL Configuration** : vérifier que `https://arcorawatch.com/**` est dans les Redirect URLs.

## 3. Cloudflare

Ajouter `VITE_GOOGLE_AUTH=true` dans les variables de build, puis relancer un déploiement.

Un compte créé avec Google est un compte Arcora comme les autres : même parrainage, même accueil (`/bienvenue`).
Si l'adresse Gmail existe déjà avec un mot de passe, Supabase relie automatiquement les deux connexions.
