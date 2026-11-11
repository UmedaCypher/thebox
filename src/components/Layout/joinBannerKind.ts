// Quelle invitation montrer à un visiteur, selon la page publique (null : aucune).
/** Pages publiques où l'invitation a du sens (pas l'accueil, déjà une invitation, ni les pages légales). */
export function joinBannerKind(pathname: string): 'passport' | 'profile' | 'gallery' | 'market' | 'stolen' | 'other' | null {
  const seg = pathname.split('/')[1];
  switch (seg) {
    case 'passeport': return 'passport';
    case 'profil': return pathname.split('/').length > 2 ? 'profile' : null;
    case 'galerie': return 'gallery';
    case 'marche': return 'market';
    case 'montres-volees': return 'stolen';
    case 'arcora-vs': case 'actualites': return 'other';
    default: return null;
  }
}
