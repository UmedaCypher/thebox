/**
 * Vidéos de la chaîne YouTube MAHEwatches associées aux guides du magazine.
 * Clé : translationKey de l'article (la même vidéo s'affiche en FR et en EN).
 * Chaque vidéo produit un lecteur léger (chargé seulement au clic) et un schéma VideoObject.
 */
export interface Video {
  id: string;
  title: string;          // titre d'origine sur YouTube
  description: string;    // une ou deux phrases, pour le schéma VideoObject
  uploadDate: string;     // AAAA-MM-JJ
  duration: string;       // ISO 8601, ex. PT6M49S
  lang: 'fr' | 'en';      // langue de la vidéo
}

export const VIDEOS: Record<string, Video> = {
  'fake-watch-check': {
    id: 'YmyphZ1mC1E',
    title: "J'ai failli perdre 10 000 € (Le piège des fausses Rolex)",
    description: "Les 6 signes qui trahissent une fausse montre, des copies grossières aux « super fakes », et le signal d'alarme qui doit vous arrêter avant d'acheter.",
    uploadDate: '2025-06-01',
    duration: 'PT6M49S',
    lang: 'fr',
  },
  'watch-collection-building': {
    id: 'jxYb31SsCjU',
    title: "Ne gaspillez pas votre argent ! Les montres que vous regretterez d'acheter",
    description: "Répliques, montres hommage, prix gonflés, marques inconnues, arnaques de l'occasion, achats impulsifs : les achats à éviter quand on construit sa collection.",
    uploadDate: '2025-03-16',
    duration: 'PT14M31S',
    lang: 'fr',
  },
  'watch-service-interval': {
    id: 'HdUoRjWgMEw',
    title: '5 Astuces Simples Qui Améliorent Ta Montre (ça ne coute rien)',
    description: 'Nettoyage, bracelet, verre, joints d’étanchéité, rangement : cinq gestes simples pour entretenir sa montre entre deux révisions.',
    uploadDate: '2025-05-11',
    duration: 'PT6M39S',
    lang: 'fr',
  },
  'watch-collection-insurance': {
    id: 'm6q9tDydkP0',
    title: '6 Montres que les Braqueurs Ignorent',
    description: 'Des montres élégantes et discrètes pour la ville, et les bons réflexes pour porter ses montres sans attirer l’attention.',
    uploadDate: '2024-10-17',
    duration: 'PT3M28S',
    lang: 'fr',
  },
};

/** Vidéos de la page auteur. */
export const AUTHOR_VIDEOS: Video[] = [
  {
    id: 'hQ6_Pi4Gjao',
    title: "J'ai passé 1 an à créer l'app que les collectionneurs attendaient",
    description: "Pourquoi et comment Arcora est née : Wrist Check, galerie au poignet, collection, Marché, suivi des entretiens et inventaire pour l'assurance.",
    uploadDate: '2026-11-05',
    duration: 'PT10M18S',
    lang: 'fr',
  },
  {
    id: 'FG8zD-pBYb8',
    title: 'Comment je suis passé des cartes POKÉMON aux MONTRES de luxe',
    description: 'Le parcours de collectionneur de Quentin Mahé, des cartes Pokémon aux montres, et les points communs entre ces deux marchés.',
    uploadDate: '2026-04-09',
    duration: 'PT12M4S',
    lang: 'fr',
  },
];

export const videoThumb = (v: Video) => `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;

export function videoSchema(v: Video) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description,
    thumbnailUrl: [`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`, videoThumb(v)],
    uploadDate: v.uploadDate,
    duration: v.duration,
    inLanguage: v.lang,
    contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`,
    author: { '@id': 'https://arcorawatch.com/#quentin-mahe' },
  };
}
