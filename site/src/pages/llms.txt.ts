import { SITE, T, articlePath, getArticles, magazinePath } from '../lib/i18n';

/**
 * /llms.txt : résumé du site pour les moteurs IA (ChatGPT, Perplexity, Gemini…),
 * selon la convention llmstxt.org. Liste les guides du magazine dans les deux langues.
 */
export async function GET() {
  const fr = await getArticles('fr');
  const en = await getArticles('en');
  const line = (a: Awaited<ReturnType<typeof getArticles>>[number]) =>
    `- [${a.data.title}](${SITE}${articlePath(a)}): ${a.data.description}`;
  const body = [
    '# Arcora',
    '',
    "> Arcora est l'app des collectionneurs de montres : catalogue de collection, carnet de portage, suivi de l'entretien, timegrapher, galerie au poignet et marché entre particuliers. Arcora is the app for watch collectors.",
    '',
    `Le magazine publie des guides pratiques en français (${SITE}${magazinePath('fr')}) et en anglais (${SITE}${magazinePath('en')}).`,
    '',
    `## ${T.fr.magazine} (français)`,
    ...fr.map(line),
    '',
    '## Magazine (English)',
    ...en.map(line),
    '',
    "## L'app",
    `- [Arcora](${SITE}/): cataloguer sa collection de montres, noter ce que l'on porte, suivre l'entretien`,
    `- [Galerie au poignet](${SITE}/galerie): photos de montres portées, filtrables par tour de poignet`,
    `- [Marché](${SITE}/marche): annonces de montres entre collectionneurs`,
    `- [Montres volées](${SITE}/montres-volees): vérifier si un numéro de série a été déclaré volé`,
    `- [FAQ](${SITE}/faq)`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
