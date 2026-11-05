import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Un article = un fichier Markdown dans src/content/articles/fr/ ou src/content/articles/en/.
 * Le nom du fichier devient l'adresse : fr/taille-montre-poignet.md → /magazine/taille-montre-poignet/
 * Les deux versions d'un même article partagent la même « translationKey ».
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) => z.object({
    title: z.string().max(70, 'Titre trop long pour Google (70 caractères max).'),
    description: z.string().min(70).max(165, 'Description trop longue (165 caractères max).'),
    lang: z.enum(['fr', 'en']),
    translationKey: z.string(),
    category: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().default('Arcora'),
    // Image principale : fichier dans src/content/articles/images/, idéalement 1200 px de large ou plus (exigé par Google Discover).
    cover: image().optional(),
    coverAlt: z.string().optional(),
    coverCaption: z.string().optional(),
    draft: z.boolean().default(false),
  }).refine((d) => !d.cover || !!d.coverAlt?.trim(), {
    message: "coverAlt est obligatoire quand il y a une image principale (cover) : décrivez l'image.",
    path: ['coverAlt'],
  }),
});

export const collections = { articles };
