# Magazine Arcora

Le magazine est un petit site **Astro** rangé dans le dossier `site/`. Il est servi sur le même domaine que l'app, sans redirection :

| Adresse | Contenu |
|---|---|
| `arcorawatch.com/` | l'app (inchangée) |
| `arcorawatch.com/magazine/` | magazine en français |
| `arcorawatch.com/en/magazine/` | magazine en anglais |
| `/magazine/rss.xml`, `/en/magazine/rss.xml` | flux RSS |
| `/magazine/articles.json` | liste lue par la page Actualités de l'app |
| `/sitemap-index.xml`, `/robots.txt` | référencement (pages publiques de l'app incluses) |

## Comment ça marche

`npm run build` construit l'app (Vite), puis le magazine (Astro), puis copie le magazine dans le même dossier `dist/`.
Cloudflare sert d'abord les fichiers qui existent (`/magazine/...`), et renvoie l'app pour toutes les autres adresses.
Rien à changer dans Cloudflare : la commande de build reste `npm run build`.

L'app installée (PWA) ne remplace pas ces pages : elles sont exclues du service worker (`navigateFallbackDenylist` dans `vite.config.ts`).
Dans l'app, les liens vers le magazine sont des liens `<a href>` classiques, jamais des `<Link>` du routeur.

## Écrire et publier depuis le backoffice
Les articles du magazine s'écrivent dans **Backoffice → Magazine** (`/admin/magazine`).
La base Supabase fait foi ; le site reste statique et rapide :

1. Vous publiez ou modifiez un article publié.
2. La base appelle le *Deploy Hook* Cloudflare : le site se reconstruit.
3. Pendant la construction, `site/scripts/sync-articles.mjs` lit les articles publiés (clé publique) et
   les écrit en Markdown, puis Astro génère les pages, les images optimisées, le RSS et l'index JSON.

L'article est en ligne **2 à 3 minutes** après la publication.

### Mise en place (une seule fois)

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

### Bon à savoir

- **Brouillon** : invisible sur le site. **Retirer du site** repasse un article en brouillon.
- Titre 5 à 70 caractères, description 70 à 165 : les limites de Google, vérifiées par l'éditeur, la base et le site.
- **Adresse** : changer l'adresse d'un article en ligne casse les liens déjà partagés.
- **Clé de traduction** : la même pour les versions FR et EN d'un article, pour que le site les relie.
- Images : envoyées dans le stockage `magazine` (1600 px). La couverture est recopiée et optimisée à la construction ;
  les images du texte sont servies depuis Supabase.
- Si la base est injoignable pendant une construction, le site se construit avec les fichiers du dépôt.
- Dès que la base contient des articles publiés, ce sont eux qui font foi : un fichier Markdown ajouté à la main
  dans le dépôt sans équivalent en base n'apparaît plus. Écrivez donc les articles dans le backoffice.

## Format Markdown (référence)

C'est le format des fichiers que la construction génère à partir du backoffice. Avant la mise en place du backoffice, ou si la base est injoignable, on peut encore publier à la main :


1. Créer un fichier Markdown dans `site/src/content/articles/fr/` (et sa traduction dans `site/src/content/articles/en/`).
   Le nom du fichier devient l'adresse : `fr/taille-montre-poignet.md` → `/magazine/taille-montre-poignet/`.
2. En-tête obligatoire :

```md
---
title: "Titre de 70 caractères maximum"
description: "Résumé de 70 à 165 caractères, affiché par Google sous le titre."
lang: fr
translationKey: watch-size-wrist   # identique dans les deux langues : relie FR et EN (hreflang)
category: Guides
publishedAt: 2026-11-05
author: Arcora                     # ou ton nom, pour signer l'article
# updatedAt: 2026-12-01            # à ajouter quand l'article est mis à jour
cover: ../images/nom-descriptif.webp     # image principale (voir « Images » ci-dessous)
coverAlt: "Ce que montre l'image, en une phrase"   # obligatoire si cover
coverCaption: "Légende affichée sous l'image"      # facultatif
# draft: true                      # brouillon : non publié
---
```

3. Pousser sur `main` : Cloudflare reconstruit et publie en quelques minutes.

Un titre ou une description trop longs bloquent le build avec un message clair.

## Images

Depuis le backoffice, les images s'envoient avec le bouton de la barre d'outils. À la main, toutes les images vont dans `site/src/content/articles/images/` (JPEG, PNG ou WebP, idéalement 1200 px de large ou plus).
Astro les optimise tout seul au build : formats AVIF et WebP, plusieurs tailles selon l'écran, largeur et hauteur fixées.

**Image principale** : champs `cover`, `coverAlt` et `coverCaption` de l'en-tête. Elle sert aussi d'image de partage
(Facebook, LinkedIn, WhatsApp, X : version JPEG 1200×630 générée automatiquement) et d'image pour Google (données structurées).

**Image dans le texte** : une ligne seule, avec le texte alternatif entre crochets et la légende entre guillemets :

```md
![Omega Speedmaster à lunette tachymétrique verte, portée au poignet](../images/omega-speedmaster-poignet.webp "La lunette tachymétrique encadre le cadran.")
```

Elle devient une figure avec sa légende. Le texte alternatif est obligatoire : sans lui, le build s'arrête.

Bonnes pratiques SEO :
- **Nom de fichier** descriptif, en minuscules avec des tirets : `tudor-black-bay-58-poignet-17cm.webp`, pas `IMG_4521.jpg`.
- **Texte alternatif** : décrit ce qu'on voit (marque, modèle, contexte), en une phrase, sans « image de ». Une version par langue.
- **Légende** : apporte une information en plus (taille, poignet, détail à remarquer). Elle est très lue.
- **Photos originales** de préférence (les tiennes, celles de la galerie avec l'accord du membre) : Google valorise les images uniques.

La typographie française (espace insécable avant « ? ! : ; ») est appliquée automatiquement.

## Travailler en local

- `npm run dev:magazine` : le magazine seul, sur http://localhost:4321/magazine/
- `npm run build` puis `npx wrangler dev` : l'app et le magazine ensemble, comme sur Cloudflare.

## Règles éditoriales

- Sujets pratiques de collectionneur, liés à une fonction d'Arcora (taille et galerie au poignet, entretien, valeur, assurance, photo).
- Chaque article apporte un avis ou une expérience réelle ; une IA peut rédiger le brouillon, mais un humain relit avant publication.
- La version anglaise est adaptée, pas traduite mot à mot (unités, mots-clés : « lug-to-lug », « full set »…).
- Les actualités des autres sites restent dans l'app (page Actualités), jamais sur le site public.
