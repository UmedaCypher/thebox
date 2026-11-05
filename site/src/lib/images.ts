import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** Image de partage (Facebook, LinkedIn, WhatsApp, X) : JPEG 1200×630, recadré au centre. */
export async function shareImage(src: ImageMetadata) {
  const img = await getImage({ src, width: 1200, height: 630, fit: 'cover', format: 'jpg', quality: 82 });
  return img.src;
}

/** Vignette légère pour les listes (page Actualités de l'app, flux). */
export async function thumbImage(src: ImageMetadata) {
  const img = await getImage({ src, width: 480, height: 300, fit: 'cover', format: 'webp', quality: 78 });
  return img.src;
}
