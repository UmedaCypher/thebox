const SRC_KEY = 'thebox-src';

/** Retient la provenance (?src=youtube, ?src=podcast…) dès la première visite. */
export function captureSource() {
  try {
    const src = new URLSearchParams(window.location.search).get('src');
    if (src) localStorage.setItem(SRC_KEY, src.slice(0, 60));
  } catch { /* stockage indisponible */ }
}

export const readSource = () => { try { return localStorage.getItem(SRC_KEY); } catch { return null; } };
