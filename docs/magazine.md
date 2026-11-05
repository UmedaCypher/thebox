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

## Publier un article

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
# cover: /magazine/images/xxx.jpg  # image 1200×675, à placer dans site/public/magazine/images/
# coverAlt: "Description de l'image"
# draft: true                      # brouillon : non publié
---
```

3. Pousser sur `main` : Cloudflare reconstruit et publie en quelques minutes.

Un titre ou une description trop longs bloquent le build avec un message clair.

## Travailler en local

- `npm run dev:magazine` : le magazine seul, sur http://localhost:4321/magazine/
- `npm run build` puis `npx wrangler dev` : l'app et le magazine ensemble, comme sur Cloudflare.

## Règles éditoriales

- Sujets pratiques de collectionneur, liés à une fonction d'Arcora (taille et galerie au poignet, entretien, valeur, assurance, photo).
- Chaque article apporte un avis ou une expérience réelle ; une IA peut rédiger le brouillon, mais un humain relit avant publication.
- La version anglaise est adaptée, pas traduite mot à mot (unités, mots-clés : « lug-to-lug », « full set »…).
- Les actualités des autres sites restent dans l'app (page Actualités), jamais sur le site public.
