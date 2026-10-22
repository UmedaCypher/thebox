/**
 * Prépare une photo avant envoi : redimensionne (2000 px max) et ré-encode en JPEG.
 * Le ré-encodage via canvas supprime toutes les métadonnées EXIF, dont la position GPS :
 * une photo de montre de valeur ne doit jamais révéler où elle a été prise.
 */
export async function preparePhoto(file: File, maxSide = 2000, quality = 0.86): Promise<File> {
  const bitmap = await loadBitmap(file);
  try {
    return await encode(bitmap, file.name, maxSide, quality);
  } finally {
    if ('close' in bitmap) (bitmap as ImageBitmap).close();
  }
}

/** Taille des miniatures : assez pour une carte de 320 px sur un écran haute densité. */
export const THUMB_SIDE = 640;

/**
 * Prépare la photo pleine taille et sa miniature à partir d'une seule lecture du fichier.
 * La miniature (≈ 50 Ko au lieu de ≈ 500 Ko) sert pour les grilles, la galerie et le calendrier.
 */
export async function preparePhotoWithThumb(file: File): Promise<{ full: File; thumb: File }> {
  const bitmap = await loadBitmap(file);
  try {
    const full = await encode(bitmap, file.name, 2000, 0.86);
    const thumb = await encode(bitmap, file.name, THUMB_SIDE, 0.8);
    return { full, thumb };
  } finally {
    if ('close' in bitmap) (bitmap as ImageBitmap).close();
  }
}

async function encode(bitmap: ImageBitmap | HTMLImageElement, name: string, maxSide: number, quality: number): Promise<File> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Impossible de préparer la photo sur cet appareil.");
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Conversion de la photo impossible.'))), 'image/jpeg', quality),
  );
  const base = name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // imageOrientation applique la rotation EXIF avant qu'elle soit perdue.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* repli ci-dessous (ex. HEIC sur certains navigateurs) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
