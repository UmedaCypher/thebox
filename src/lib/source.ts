const SRC_KEY = 'thebox-src';

/** Retient la provenance (?src=youtube, ?src=podcast…) dès la première visite. */
export function captureSource() {
  try {
    const src = new URLSearchParams(window.location.search).get('src');
    if (src) localStorage.setItem(SRC_KEY, src.slice(0, 60));
  } catch { /* stockage indisponible */ }
}

export const readSource = () => { try { return localStorage.getItem(SRC_KEY); } catch { return null; } };

/* ---------- Affiliation : lien …?ref=code ---------- */
const REF_KEY = 'thebox-ref';
/** Un lien d'affilié reste valable 60 jours ; le dernier lien suivi l'emporte. */
export const REF_DAYS = 60;
const REF_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;

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
