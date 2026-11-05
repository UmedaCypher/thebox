/**
 * Images dans le corps des articles.
 *
 * En Markdown :  ![Texte alternatif](../images/fichier.webp "Légende affichée sous l'image")
 *
 * - Une image seule sur sa ligne devient <figure><img><figcaption>Légende</figcaption></figure>.
 * - Le texte alternatif est obligatoire : sans lui, le build s'arrête avec un message clair
 *   (c'est ce que lisent Google Images et les lecteurs d'écran).
 */
export default function rehypeFigure() {
  return (tree, file) => {
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'img') checkAlt(child, file);
        if (child.type !== 'element' || child.tagName !== 'p') { visit(child); return child; }

        const meaningful = child.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
        const img = meaningful.length === 1 && meaningful[0].type === 'element' && meaningful[0].tagName === 'img' ? meaningful[0] : null;
        if (!img) { visit(child); return child; }

        checkAlt(img, file);
        const caption = img.properties.title;
        delete img.properties.title;
        return {
          type: 'element',
          tagName: 'figure',
          properties: {},
          children: [img, ...(caption ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(caption) }] }] : [])],
        };
      });
    };
    visit(tree);
  };
}

function checkAlt(img, file) {
  const alt = img.properties.alt;
  if (typeof alt !== 'string' || !alt.trim()) {
    const where = file?.path ? ` (${file.path.split('/content/')[1] ?? file.path})` : '';
    throw new Error(`Image sans texte alternatif${where} : écrire ![description de l'image](chemin) — src = ${img.properties.src}`);
  }
}

/** Français : espace insécable fine avant ? ! ; : et » (le signe ne passe jamais seul à la ligne). */
export const frTypo = (s) => s.replace(/ ([?!;:»])/g, ' $1').replace(/« /g, '« ');

export function rehypeFrenchTypo() {
  return (tree, file) => {
    if (!/[\\/]fr[\\/]/.test(file?.path ?? '')) return;
    const walk = (n) => {
      if (n.type === 'text') n.value = frTypo(n.value);
      if (n.type === 'element' && (n.tagName === 'code' || n.tagName === 'pre')) return;
      n.children?.forEach(walk);
    };
    walk(tree);
  };
}
