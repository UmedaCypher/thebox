const SRC_KEY = 'thebox-src';

/** Liens courts à donner dans les médias : arcora.app/yt, arcora.app/podcast… */
export const SHORT_LINKS: Record<string, string> = {
  yt: 'youtube', podcast: 'podcast', ig: 'instagram', tiktok: 'tiktok', discord: 'discord',
};

export function rememberSource(src: string) {
  try { localStorage.setItem(SRC_KEY, src.slice(0, 60)); } catch { /* stockage indisponible */ }
}

/** Retient la provenance (?src=youtube, ou ?utm_source=…) dès la première visite. */
export function captureSource() {
  const params = new URLSearchParams(window.location.search);
  const src = params.get('src') ?? params.get('utm_source');
  if (src) rememberSource(src.toLowerCase());
}

export const readSource = () => { try { return localStorage.getItem(SRC_KEY); } catch { return null; } };

/* ---------- Affiliation : lien …?ref=code ---------- */
const REF_KEY = 'thebox-ref';
/** Un lien d'affilié reste valable 60 jours ; le dernier lien suivi l'emporte. */
export const REF_DAYS = 60;
const REF_RE = /^[a-z0-9._-]{3,30}$/;

export function captureRef() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toLowerCase();
    if (ref && REF_RE.test(ref)) localStorage.setItem(REF_KEY, JSON.stringify({ code: ref, at: Date.now() }));
  } catch { /* stockage indisponible */ }
}

/** Code de l'affilié par lequel ce visiteur est arrivé, s'il date de moins de 60 jours. */
export function readRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
    if (!code || !REF_RE.test(code) || !at || Date.now() - at > REF_DAYS * 864e5) { localStorage.removeItem(REF_KEY); return null; }
    return code;
  } catch { return null; }
}

/** Lien de partage avec le code de parrainage du membre (son pseudo, ou son code d'ambassadeur). */
export function withRef(url: string, code: string | null | undefined) {
  if (!code) return url;
  const u = new URL(url, window.location.origin);
  u.searchParams.set('ref', code.toLowerCase());
  return u.toString();
}
