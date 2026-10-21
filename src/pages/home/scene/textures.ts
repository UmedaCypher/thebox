/**
 * Textures procédurales dessinées sur canvas : aucune image à télécharger.
 * Cadrans, lunettes, grain du cuir, trame du velours, gravure de la plaque.
 */
import * as THREE from 'three';

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true, repeat?: number) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}

/** Bruit de valeur lissé, base du cuir et du velours. */
function noiseCanvas(size: number, scale: number, contrast: number, seed = 1) {
  const [c, ctx] = canvas(size);
  const img = ctx.createImageData(size, size);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = Array.from({ length: (scale + 1) * (scale + 1) }, rnd);
  const at = (x: number, y: number) => g[(y % scale) * (scale + 1) + (x % scale)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * scale, fy = (y / size) * scale;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
      const fine = rnd();
      const n = 128 + (v - 0.5) * 255 * contrast + (fine - 0.5) * 40;
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, n));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Carte de relief (bump) : grain du cuir. */
export const leatherBump = () => toTexture(noiseCanvas(256, 48, 0.9, 7), false, 3);
/** Carte de relief : trame fine du velours. */
export const velvetBump = () => toTexture(noiseCanvas(512, 180, 0.6, 3), false, 6);
/** Variations de teinte du velours (couleur, multipliée par la couleur du matériau). */
export const velvetTint = () => {
  const c = noiseCanvas(256, 24, 0.35, 11);
  const ctx = c.getContext('2d')!;
  const img = ctx.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const v = 200 + (img.data[i] - 128) * 0.35; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, true, 2);
};

/** Plaque en laiton gravée. */
export function plaqueTexture() {
  const [c, ctx] = canvas(512);
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, '#9c7a48'); g.addColorStop(0.45, '#e1c690'); g.addColorStop(0.55, '#c9a66d'); g.addColorStop(1, '#8a6835');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; ctx.fillRect(0, y, 512, 1); }
  ctx.fillStyle = 'rgba(40,22,10,0.85)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `500 120px "Bodoni Moda Variable", Georgia, serif`;
  ctx.fillText('The Box', 256, 262);
  return toTexture(c);
}

/** Point lumineux doux pour la poussière en suspension. */
export function dustSprite() {
  const [c, ctx] = canvas(64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,240,215,1)'); g.addColorStop(0.35, 'rgba(255,225,180,0.45)'); g.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return toTexture(c);
}
