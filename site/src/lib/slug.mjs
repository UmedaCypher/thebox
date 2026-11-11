// Adresse d'une page « au poignet » : « Tudor » + « Black Bay 58 » → « tudor-black-bay-58 ».
// Même règle dans l'app (src/lib/slug.ts) pour pouvoir y faire des liens.
export function modelSlug(brand, model) {
  return `${brand} ${model}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' et ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '');
}
