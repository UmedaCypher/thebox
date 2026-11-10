# Magazine : rédaction depuis le backoffice

Les articles du magazine s'écrivent dans **Backoffice → Magazine** (`/admin/magazine`).
La base Supabase fait foi ; le site reste statique et rapide :

1. Vous publiez ou modifiez un article publié.
2. La base appelle le *Deploy Hook* Cloudflare : le site se reconstruit.
3. Pendant la construction, `site/scripts/sync-articles.mjs` lit les articles publiés (clé publique) et
   les écrit en Markdown, puis Astro génère les pages, les images optimisées, le RSS et l'index JSON.

L'article est en ligne **2 à 3 minutes** après la publication.

## Mise en place (une seule fois)

1. **Migrations**, dans l'ordre : `20261110150000_magazine.sql`, puis `20261110151000_magazine_articles_existants.sql`
   (reprend les 16 articles existants, images comprises).
2. **Deploy Hook** : Cloudflare → Workers & Pages → `arcorawatch` → Settings → Builds → *Deploy Hooks* →
   créer un hook sur la branche `main`. Copier l'adresse.
3. **Ranger l'adresse dans Vault** (SQL Editor de Supabase) :

   ```sql
   select vault.create_secret('https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/…', 'magazine_deploy_hook');
   ```

   Pour la remplacer plus tard : `select vault.update_secret((select id from vault.secrets where name = 'magazine_deploy_hook'), '<nouvelle adresse>');`
4. Vérifier que l'extension **pg_net** est activée (Database → Extensions).
5. Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` de la construction Cloudflare servent aussi au magazine : rien à ajouter.

Sans Deploy Hook, tout fonctionne quand même : les articles partent en ligne au prochain déploiement.

## Bon à savoir

- **Brouillon** : invisible sur le site. **Retirer du site** repasse un article en brouillon.
- Titre 5 à 70 caractères, description 70 à 165 : les limites de Google, vérifiées par l'éditeur, la base et le site.
- **Adresse** : changer l'adresse d'un article en ligne casse les liens déjà partagés.
- **Clé de traduction** : la même pour les versions FR et EN d'un article, pour que le site les relie.
- Images : envoyées dans le stockage `magazine` (1600 px). La couverture est recopiée et optimisée à la construction ;
  les images du texte sont servies depuis Supabase.
- Si la base est injoignable pendant une construction, le site se construit avec les fichiers du dépôt.
- Dès que la base contient des articles publiés, ce sont eux qui font foi : un fichier Markdown ajouté à la main
  dans le dépôt sans équivalent en base n'apparaît plus. Écrivez donc les articles dans le backoffice.
