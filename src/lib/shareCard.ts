/**
 * Cartes de partage au format portrait Instagram (1080 × 1350), dessinées sur un canvas.
 * Chaque carte porte le pseudo et l'adresse de l'app : c'est elle qui ramène de nouveaux membres.
 */

const W = 1080;
const H = 1350;
const C = { bg: '#1f0e11', bg2: '#2f161b', cushion: '#3a1c21', text: '#f3ede3', text2: '#c4b4a9', text3: '#95817a', brass: '#c2a072', seam: 'rgba(194,160,114,0.45)' };
import { defineStrings, tr } from '../i18n';

const S = defineStrings({ heading: 'Mon mois au poignet', days: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] },
  { heading: 'My month on the wrist', days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] });

const DISPLAY = '"Bodoni Moda Variable", Georgia, serif';
const BODY = '"Hanken Grotesk Variable", Helvetica, Arial, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ready() {
  try {
    await Promise.all([document.fonts.load(`500 64px ${DISPLAY}`), document.fonts.load(`600 32px ${BODY}`)]);
  } catch { /* polices de repli */ }
}

function base(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(W / 2, H * 0.3, 80, W / 2, H * 0.4, H);
  g.addColorStop(0, C.bg2);
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Couture
  ctx.strokeStyle = C.seam;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 9]);
  roundRect(ctx, 36, 36, W - 72, H - 72, 44);
  ctx.stroke();
  ctx.setLineDash([]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function footer(ctx: CanvasRenderingContext2D, username: string | null) {
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text;
  ctx.font = `500 44px ${DISPLAY}`;
  ctx.fillText('Arcora', 96, H - 104);
  // Signature : l'adresse de l'app sous le nom, pour qui voit l'image sans le lien
  ctx.fillStyle = C.text2;
  ctx.font = `500 24px ${BODY}`;
  ctx.fillText(window.location.host, 96, H - 66);
  ctx.textAlign = 'right';
  ctx.font = `500 30px ${BODY}`;
  if (username) ctx.fillText(`@${username}`, W - 96, H - 106);
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Image impossible à créer.'))), 'image/png'));

export interface MonthCardInput {
  title: string; // « Octobre 2026 »
  year: number;
  month: number; // 0-11
  photoByDay: Map<number, string | null>; // jour du mois → photo de la montre portée
  stats: { label: string; value: string }[];
  username: string | null;
}

export async function drawMonthCard(input: MonthCardInput): Promise<Blob> {
  await ready();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  base(ctx);

  ctx.fillStyle = C.text2;
  ctx.font = `500 30px ${BODY}`;
  ctx.textAlign = 'left';
  ctx.fillText(tr(S).heading, 96, 160);
  ctx.fillStyle = C.text;
  ctx.font = `500 92px ${DISPLAY}`;
  ctx.fillText(input.title, 96, 262);

  // Calendrier
  const first = new Date(input.year, input.month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysIn = new Date(input.year, input.month + 1, 0).getDate();
  const gx = 96, gy = 330, cell = (W - 192) / 7, rowH = 104, r = rowH * 0.42;
  ctx.font = `600 22px ${BODY}`;
  ctx.textAlign = 'center';
  tr(S).days.forEach((d, i) => { ctx.fillStyle = C.text3; ctx.fillText(d, gx + cell * i + cell / 2, gy); });

  const urls = [...new Set([...input.photoByDay.values()].filter(Boolean) as string[])];
  const images = new Map<string, HTMLImageElement | null>(await Promise.all(urls.map(async u => [u, await loadImage(u)] as const)));

  for (let d = 1; d <= daysIn; d++) {
    const i = offset + d - 1;
    const cx = gx + (i % 7) * cell + cell / 2;
    const cy = gy + 30 + Math.floor(i / 7) * rowH + rowH / 2;
    const worn = input.photoByDay.has(d);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = worn ? C.cushion : 'rgba(239,232,220,0.05)';
    ctx.fill();
    const src = input.photoByDay.get(d);
    const img = src ? images.get(src) : null;
    if (img) { ctx.clip(); drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2); }
    ctx.restore();
    if (worn) { ctx.strokeStyle = C.brass; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    if (!img) {
      ctx.fillStyle = worn ? C.text : C.text3;
      ctx.font = `500 26px ${BODY}`;
      ctx.fillText(String(d), cx, cy + 9);
    }
  }

  // Chiffres
  const sy = H - 300;
  const colW = (W - 192) / Math.max(1, input.stats.length);
  input.stats.forEach((st, i) => {
    const x = 96 + colW * i;
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = `500 58px ${DISPLAY}`;
    ctx.fillText(st.value, x, sy);
    ctx.fillStyle = C.text2;
    ctx.font = `500 26px ${BODY}`;
    ctx.fillText(st.label, x, sy + 44);
  });

  footer(ctx, input.username);
  return toBlob(canvas);
}

/** Partage natif (mobile) ou téléchargement. */
export async function shareImage(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text }); return 'shared'; } catch { return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/* ---------- Stories (1080 × 1920) : Wrist Check, précision, passeport ---------- */

const SW = 1080;
const SH = 1920;
const S2 = defineStrings({
  wristCheck: 'Wrist Check du jour',
  streak: (n: number) => `Série de ${n} jours`,
  accuracy: 'Précision mesurée',
  perDay: 'secondes par jour',
  beatError: 'Écart de battement',
  passport: 'Passeport de montre',
  join: 'Votre collection, votre écrin',
}, {
  wristCheck: 'Wrist Check of the day',
  streak: (n: number) => `${n}-day streak`,
  accuracy: 'Measured accuracy',
  perDay: 'seconds a day',
  beatError: 'Beat error',
  passport: 'Watch passport',
  join: 'Your collection, beautifully kept',
});

function storyCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = SW; canvas.height = SH;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(SW / 2, SH * 0.32, 60, SW / 2, SH * 0.45, SH);
  g.addColorStop(0, C.bg2);
  g.addColorStop(1, C.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  return { canvas, ctx };
}

/** Texte sur plusieurs lignes, coupé aux mots ; renvoie la position sous la dernière ligne. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 2) {
  const words = text.split(/\s+/);
  let line = '', lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) { ctx.fillText(`${line}…`, x, y); return y + lineH; }
      ctx.fillText(line, x, y); y += lineH; lines++; line = words[i];
    } else line = test;
  }
  if (line) { ctx.fillText(line, x, y); y += lineH; }
  return y;
}

/** Photo en haut de la story, coins arrondis, fondu vers le bas pour le texte. */
function storyPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, y: number, h: number) {
  const x = 72, w = SW - 144;
  ctx.save();
  roundRect(ctx, x, y, w, h, 48);
  ctx.clip();
  if (img) drawCover(ctx, img, x, y, w, h);
  else { ctx.fillStyle = C.cushion; ctx.fillRect(x, y, w, h); }
  const fade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  fade.addColorStop(0, 'rgba(31,14,17,0)');
  fade.addColorStop(1, 'rgba(31,14,17,0.85)');
  ctx.fillStyle = fade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = C.seam; ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 48); ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.brass) {
  ctx.font = `700 30px ${BODY}`;
  const w = ctx.measureText(text).width + 56;
  ctx.fillStyle = 'rgba(31,14,17,0.72)';
  roundRect(ctx, x, y - 42, w, 60, 30); ctx.fill();
  ctx.strokeStyle = 'rgba(194,160,114,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'left';
  ctx.fillText(text, x + 28, y);
}

function storyFooter(ctx: CanvasRenderingContext2D, username: string | null) {
  const y = SH - 150;
  ctx.strokeStyle = 'rgba(239,232,220,0.14)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(96, y - 70); ctx.lineTo(SW - 96, y - 70); ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text; ctx.font = `500 56px ${DISPLAY}`;
  ctx.fillText('Arcora', 96, y);
  ctx.fillStyle = C.text2; ctx.font = `500 28px ${BODY}`;
  ctx.fillText(`${tr(S2).join} · arcorawatch.com`, 96, y + 48);
  if (username) {
    ctx.textAlign = 'right'; ctx.fillStyle = C.brass; ctx.font = `600 32px ${BODY}`;
    ctx.fillText(`@${username}`, SW - 96, y);
  }
}

export interface WristStoryInput { photo: string | null; brand: string; model: string; dateLabel: string; streak: number; username: string | null }

export async function drawWristCheckStory(i: WristStoryInput): Promise<Blob> {
  await ready();
  const { canvas, ctx } = storyCanvas();
  const img = i.photo ? await loadImage(i.photo) : null;
  storyPhoto(ctx, img, 120, 1180);
  const t = tr(S2);
  if (i.streak >= 2) pill(ctx, t.streak(i.streak), 120, 222);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text2; ctx.font = `600 30px ${BODY}`;
  ctx.fillText(`${t.wristCheck.toUpperCase()} · ${i.dateLabel}`, 96, 1390);
  ctx.fillStyle = C.text; ctx.font = `500 60px ${DISPLAY}`;
  ctx.fillText(i.brand, 96, 1470);
  ctx.font = `500 84px ${DISPLAY}`;
  wrapText(ctx, i.model, 96, 1560, SW - 192, 90);
  storyFooter(ctx, i.username);
  return toBlob(canvas);
}

export interface AccuracyStoryInput { rate: number; beatError: number; bph: number; verdict: string; brand?: string | null; model?: string | null; photo?: string | null; username: string | null }

export async function drawAccuracyStory(i: AccuracyStoryInput): Promise<Blob> {
  await ready();
  const { canvas, ctx } = storyCanvas();
  const t = tr(S2);
  const img = i.photo ? await loadImage(i.photo) : null;
  if (img) storyPhoto(ctx, img, 120, 760);
  const top = img ? 960 : 640;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text2; ctx.font = `600 30px ${BODY}`;
  ctx.fillText(t.accuracy.toUpperCase(), 96, top);
  if (i.brand || i.model) {
    ctx.fillStyle = C.text; ctx.font = `500 56px ${DISPLAY}`;
    wrapText(ctx, `${i.brand ?? ''} ${i.model ?? ''}`.trim(), 96, top + 80, SW - 192, 64, 1);
  }
  // Le chiffre, en grand, couleur lume
  const value = `${i.rate > 0 ? '+' : i.rate < 0 ? '−' : '±'}${Math.abs(i.rate).toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
  ctx.fillStyle = '#c9e7a7'; ctx.font = `500 250px ${DISPLAY}`;
  ctx.fillText(value, 84, top + 340);
  ctx.fillStyle = C.text2; ctx.font = `500 40px ${BODY}`;
  ctx.fillText(t.perDay, 100, top + 410);
  pill(ctx, i.verdict, 96, top + 520, C.text);
  ctx.fillStyle = C.text3; ctx.font = `500 30px ${BODY}`;
  ctx.fillText(`${t.beatError} ${i.beatError.toLocaleString(undefined, { maximumFractionDigits: 1 })} ms · ${i.bph.toLocaleString()} A/h`, 96, top + 610);
  storyFooter(ctx, i.username);
  return toBlob(canvas);
}

export interface PassportStoryInput { photo: string | null; brand: string; model: string; facts: string[]; username: string | null }

export async function drawPassportStory(i: PassportStoryInput): Promise<Blob> {
  await ready();
  const { canvas, ctx } = storyCanvas();
  const img = i.photo ? await loadImage(i.photo) : null;
  storyPhoto(ctx, img, 120, 1000);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.text2; ctx.font = `600 30px ${BODY}`;
  ctx.fillText(tr(S2).passport.toUpperCase(), 96, 1210);
  ctx.fillStyle = C.text; ctx.font = `500 60px ${DISPLAY}`;
  ctx.fillText(i.brand, 96, 1290);
  ctx.font = `500 84px ${DISPLAY}`;
  let y = wrapText(ctx, i.model, 96, 1380, SW - 192, 90);
  ctx.fillStyle = C.text2; ctx.font = `500 34px ${BODY}`;
  for (const f of i.facts.slice(0, 3)) { ctx.fillText(f, 96, y + 10); y += 52; }
  storyFooter(ctx, i.username);
  return toBlob(canvas);
}
