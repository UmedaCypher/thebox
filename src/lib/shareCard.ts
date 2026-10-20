/**
 * Cartes de partage au format portrait Instagram (1080 × 1350), dessinées sur un canvas.
 * Chaque carte porte le pseudo et l'adresse de l'app : c'est elle qui ramène de nouveaux membres.
 */

const W = 1080;
const H = 1350;
const C = { bg: '#1f0e11', bg2: '#2f161b', cushion: '#3a1c21', text: '#f3ede3', text2: '#c4b4a9', text3: '#95817a', brass: '#c2a072', seam: 'rgba(194,160,114,0.45)' };
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
  ctx.fillText('The Box', 96, H - 104);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.text2;
  ctx.font = `500 30px ${BODY}`;
  ctx.fillText(username ? `@${username}` : window.location.host, W - 96, H - 106);
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
  ctx.fillText('Mon mois au poignet', 96, 160);
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
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((d, i) => { ctx.fillStyle = C.text3; ctx.fillText(d, gx + cell * i + cell / 2, gy); });

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
