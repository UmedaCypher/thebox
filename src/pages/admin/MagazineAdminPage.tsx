import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { Bold, ExternalLink, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Plus, Quote, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  deleteMagazineArticle, getMagazineArticle, listMagazineArticles, magazineImageUrl, saveMagazineArticle, uploadMagazineImage,
} from '../../lib/api';
import type { MagazineArticle, MagazineArticleInput } from '../../lib/api';
import { Button, Combobox, EmptyState, IconButton, LinkButton, Loading, Notice, PageHeader, Segmented, SelectField, TextArea, TextField } from '../../components/ui';
import { useToast } from '../../components/Toast/Toast';
import { formatDate, todayISO } from '../../lib/format';
import a from './AdminPage.module.css';
import s from './MagazineAdmin.module.css';

/*
 * Magazine : rédaction des articles depuis le backoffice.
 * Les règles reprennent celles de la base et du site (longueurs pour Google, adresse, description d'image),
 * pour qu'un article enregistré ici passe toujours la construction du site.
 * Publier relance la construction : l'article est en ligne 2 à 3 minutes plus tard.
 */

const SITE = 'https://arcorawatch.com';
const LIMITS = { title: [5, 70], description: [70, 165] } as const;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugify = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
const articleUrl = (r: Pick<MagazineArticle, 'lang' | 'slug'>) => `${SITE}${r.lang === 'fr' ? '/magazine/' : '/en/magazine/'}${r.slug}/`;

/** Champs modifiables d'un article (les descriptions vides deviennent '' pour les champs du formulaire). */
const toInput = (r: MagazineArticle): MagazineArticleInput => ({
  lang: r.lang, slug: r.slug, translation_key: r.translation_key, title: r.title, description: r.description,
  category: r.category, author: r.author, body_md: r.body_md, cover_path: r.cover_path,
  cover_alt: r.cover_alt ?? '', cover_caption: r.cover_caption ?? '', status: r.status, published_at: r.published_at,
});

function useAdmin() {
  const { profile } = useAuth();
  return { ready: Boolean(profile), isAdmin: profile?.account_type === 'admin' };
}

export default function MagazineAdminPage() {
  const { articleId } = useParams();
  const { ready, isAdmin } = useAdmin();
  if (!ready) return <div className="page"><Loading /></div>;
  if (!isAdmin) return <div className="page"><EmptyState title="Accès réservé">Cette page est réservée à l'administrateur.</EmptyState></div>;
  return articleId ? <Editor key={articleId} id={articleId === 'nouveau' ? null : articleId} /> : <ArticleList />;
}

/* ---------- Liste ---------- */

function ArticleList() {
  const [rows, setRows] = useState<MagazineArticle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'all' | 'fr' | 'en'>('all');
  useEffect(() => {
    listMagazineArticles().then(setRows).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  const shown = useMemo(() => (rows ?? []).filter(r => lang === 'all' || r.lang === lang), [rows, lang]);
  const drafts = (rows ?? []).filter(r => r.status === 'draft').length;

  return (
    <div className={`page ${a.page}`}>
      <PageHeader title="Magazine" back={{ to: '/admin', label: 'Backoffice' }}
        subtitle={rows ? `${rows.length - drafts} publiés · ${drafts} brouillon${drafts > 1 ? 's' : ''}` : undefined}
        action={<LinkButton to="/admin/magazine/nouveau"><Plus size={16} aria-hidden="true" />Nouvel article</LinkButton>} />
      {error && <Notice tone="error">{error}</Notice>}
      {!rows ? (!error && <Loading />) : (
        <>
          <Segmented label="Langue" value={lang} onChange={setLang}
            options={[{ value: 'all', label: 'Toutes' }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} />
          {shown.length === 0 ? (
            <EmptyState title="Aucun article">Écrivez le premier : il sera publié sur le magazine du site.</EmptyState>
          ) : (
            <ul className={s.list}>
              {shown.map(r => (
                <li key={r.id} className={`panel ${s.item}`}>
                  <div className={s.itemText}>
                    <span className={s.itemMeta}>
                      <span className={s.lang}>{r.lang.toUpperCase()}</span>
                      <span className={a.status} data-status={r.status === 'published' ? 'active' : 'pending'}>
                        {r.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                      <span>{r.category}</span>
                      <span>{formatDate(r.published_at, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                    <Link to={`/admin/magazine/${r.id}`} className={s.itemTitle}>{r.title}</Link>
                    <span className={s.itemDesc}>{r.description}</span>
                  </div>
                  {r.status === 'published' && (
                    <a className={s.itemLink} href={articleUrl(r)} target="_blank" rel="noopener noreferrer" aria-label={`Voir « ${r.title} » sur le site`}>
                      <ExternalLink size={16} aria-hidden="true" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Éditeur ---------- */

const EMPTY: MagazineArticleInput = {
  lang: 'fr', slug: '', translation_key: '', title: '', description: '', category: '', author: 'Arcora',
  body_md: '', cover_path: null, cover_alt: '', cover_caption: '', status: 'draft', published_at: todayISO(),
};

function Counter({ value, range }: { value: string; range: readonly [number, number] }) {
  const n = value.trim().length;
  const ok = n >= range[0] && n <= range[1];
  return <span className={s.counter} data-ok={ok}>{n} / {range[0]}–{range[1]}</span>;
}

function Editor({ id }: { id: string | null }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<MagazineArticleInput | null>(id ? null : EMPTY);
  const [saved, setSaved] = useState<MagazineArticleInput | null>(id ? null : EMPTY);
  const [all, setAll] = useState<MagazineArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [keyTouched, setKeyTouched] = useState(Boolean(id));
  const [tried, setTried] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listMagazineArticles().then(setAll).catch(() => {});
    if (!id) return;
    getMagazineArticle(id).then(r => {
      if (!r) { setError('Article introuvable.'); return; }
      const input = toInput(r);
      setForm(input); setSaved(input);
    }).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  const dirty = Boolean(form && saved && JSON.stringify(form) !== JSON.stringify(saved));
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const categories = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of all) if (!form || r.lang === form.lang) c.set(r.category, (c.get(r.category) ?? 0) + 1);
    return [...c].sort((x, y) => y[1] - x[1]).map(([value, n]) => ({ value, hint: String(n) }));
  }, [all, form]);
  const translationKeys = useMemo(() => {
    const k = new Map<string, string>();
    for (const r of all) if (form && r.lang !== form.lang) k.set(r.translation_key, r.title);
    return [...k].map(([value, title]) => ({ value, hint: title.length > 36 ? `${title.slice(0, 35)}…` : title }));
  }, [all, form]);
  const preview = useMemo(() => (tab === 'preview' && form ? marked.parse(form.body_md, { async: false, gfm: true }) as string : ''), [tab, form]);

  if (error && !form) return <div className="page"><Notice tone="error">{error}</Notice></div>;
  if (!form) return <div className="page"><Loading /></div>;

  const set = <K extends keyof MagazineArticleInput>(k: K, v: MagazineArticleInput[K]) => setForm(f => (f ? { ...f, [k]: v } : f));
  const onTitle = (v: string) => setForm(f => {
    if (!f) return f;
    const slug = slugTouched ? f.slug : slugify(v);
    return { ...f, title: v, slug, translation_key: keyTouched ? f.translation_key : slug };
  });

  const errors = {
    title: form.title.trim().length < 5 ? 'Au moins 5 caractères.' : form.title.trim().length > 70 ? '70 caractères au plus : Google coupe au-delà.' : null,
    description: form.description.trim().length < 70 ? 'Au moins 70 caractères : c\'est le texte affiché sous le titre dans Google.'
      : form.description.trim().length > 165 ? '165 caractères au plus.' : null,
    slug: !SLUG_RE.test(form.slug) ? 'Minuscules, chiffres et tirets seulement (ex. reviser-montre-automatique).'
      : all.some(r => r.lang === form.lang && r.slug === form.slug && r.id !== id) ? 'Cette adresse existe déjà dans cette langue.' : null,
    translation_key: form.translation_key.trim().length < 2 ? 'Obligatoire.' : null,
    category: form.category.trim().length < 2 ? 'Obligatoire.' : form.category.trim().length > 40 ? '40 caractères au plus.' : null,
    cover_alt: form.cover_path && !form.cover_alt?.trim() ? 'Décrivez l\'image (lecteurs d\'écran et Google).' : null,
    body_md: form.body_md.trim().length < 200 ? 'Le texte est trop court pour être publié (200 caractères au moins).' : null,
  };
  // Un brouillon peut être incomplet, sauf ce que la base exige pour l'enregistrer
  const blocking = (publish: boolean) => Object.entries(errors).filter(([k, v]) => v && (publish || k !== 'body_md')).length > 0;
  const show = (k: keyof typeof errors) => (tried || (form[k as keyof MagazineArticleInput] ?? '') !== '') ? errors[k] : null;

  const save = async (status: 'draft' | 'published') => {
    setTried(true);
    if (blocking(status === 'published')) { toast('Corrigez les champs signalés.'); return; }
    if (status === 'published' && saved?.status !== 'published'
      && !window.confirm('Publier cet article ? Il sera en ligne sur le site dans 2 à 3 minutes.')) return;
    setBusy(true);
    try {
      const input: MagazineArticleInput = {
        ...form, status,
        title: form.title.trim(), description: form.description.trim(), category: form.category.trim(),
        translation_key: form.translation_key.trim(), author: form.author.trim() || 'Arcora',
        cover_alt: form.cover_path ? form.cover_alt?.trim() || null : null,
        cover_caption: form.cover_path ? form.cover_caption?.trim() || null : null,
      };
      const row = await saveMagazineArticle(id, input);
      const next = toInput(row);
      setForm(next); setSaved(next);
      toast(status === 'published'
        ? (saved?.status === 'published' ? 'Modifications enregistrées : le site se met à jour (2 à 3 min).' : 'Article publié : en ligne dans 2 à 3 minutes.')
        : (saved?.status === 'published' ? 'Article retiré du site (2 à 3 min).' : 'Brouillon enregistré.'));
      if (!id) navigate(`/admin/magazine/${row.id}`, { replace: true });
    } catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };

  const remove = async () => {
    if (!id || !window.confirm(`Supprimer définitivement « ${form.title} » ?${saved?.status === 'published' ? ' Il disparaîtra du site.' : ''}`)) return;
    setBusy(true);
    try { await deleteMagazineArticle(id); setSaved(form); toast('Article supprimé.'); navigate('/admin/magazine', { replace: true }); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); setBusy(false); }
  };

  /* Insertion de Markdown autour de la sélection */
  const wrap = (before: string, after = '', placeholder = '') => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: st, selectionEnd: en, value } = el;
    const sel = value.slice(st, en) || placeholder;
    const next = value.slice(0, st) + before + sel + after + value.slice(en);
    set('body_md', next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(st + before.length, st + before.length + sel.length); });
  };
  const linePrefix = (prefix: string, placeholder: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: st, value } = el;
    const lineStart = value.lastIndexOf('\n', st - 1) + 1;
    const needsBreak = lineStart > 0 && value[lineStart - 1] === '\n' && lineStart > 1 && value[lineStart - 2] !== '\n';
    const insert = (needsBreak ? '\n' : '') + prefix;
    const rest = value.slice(lineStart);
    const add = rest.startsWith('\n') || rest === '' ? placeholder : '';
    set('body_md', value.slice(0, lineStart) + insert + add + rest);
    requestAnimationFrame(() => { el.focus(); const p = lineStart + insert.length; el.setSelectionRange(p, p + add.length); });
  };

  const upload = async (e: ChangeEvent<HTMLInputElement>, target: 'cover' | 'body') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadMagazineImage(file);
      if (target === 'cover') set('cover_path', path);
      else {
        const alt = window.prompt('Description de l\'image (pour les lecteurs d\'écran et Google) :', '') ?? '';
        wrap(`\n\n![${alt.replace(/[[\]]/g, '')}](${magazineImageUrl(path)})\n\n`);
      }
    } catch (err) { toast(err instanceof Error ? err.message : String(err)); }
    setUploading(false);
  };

  const coverUrl = magazineImageUrl(form.cover_path);
  const published = saved?.status === 'published';
  const onSubmit = (e: FormEvent) => { e.preventDefault(); save(published ? 'published' : 'draft'); };

  return (
    <form className={`page ${a.page}`} onSubmit={onSubmit} noValidate>
      <PageHeader title={id ? 'Modifier l\'article' : 'Nouvel article'} back={{ to: '/admin/magazine', label: 'Magazine' }}
        subtitle={published ? <>En ligne · <a className={s.inlineLink} href={articleUrl(form)} target="_blank" rel="noopener noreferrer">voir sur le site</a></> : 'Brouillon : invisible sur le site'} />

      <section className={`panel ${s.grid}`}>
        <SelectField label="Langue" value={form.lang} onChange={e => set('lang', e.target.value as 'fr' | 'en')}
          options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]} placeholder="Langue" />
        <TextField label="Date de publication" type="date" value={form.published_at} onChange={e => set('published_at', e.target.value || todayISO())} />
        <div className={s.full}>
          <TextField label="Titre" value={form.title} onChange={e => onTitle(e.target.value)} maxLength={90} error={show('title')}
            hint={<Counter value={form.title} range={LIMITS.title} />} />
        </div>
        <div className={s.full}>
          <TextArea label="Description" rows={3} value={form.description} onChange={e => set('description', e.target.value)} maxLength={200}
            error={show('description')} hint={<><Counter value={form.description} range={LIMITS.description} /> · Affichée dans Google, les partages et la liste du magazine.</>} />
        </div>
        <div className={s.full}>
          <TextField label="Adresse" value={form.slug} error={show('slug')} maxLength={80}
            onChange={e => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
            hint={<>{form.lang === 'fr' ? '/magazine/' : '/en/magazine/'}<strong>{form.slug || '…'}</strong>/{published && ' · Changer l\'adresse d\'un article en ligne casse les liens existants.'}</>} />
        </div>
        <Combobox label="Rubrique" value={form.category} onValueChange={v => set('category', v)} options={categories} maxLength={40} error={show('category')} />
        <TextField label="Auteur" value={form.author} onChange={e => set('author', e.target.value)} maxLength={60} />
        <div className={s.full}>
          <Combobox label="Clé de traduction" value={form.translation_key} options={translationKeys} error={show('translation_key')} maxLength={80}
            onValueChange={v => { setKeyTouched(true); set('translation_key', v); }}
            hint="Identique pour les versions française et anglaise d'un même article : le site les relie entre elles." />
        </div>
      </section>

      <section className={`panel ${s.coverPanel}`}>
        <h2 className={a.h3}>Image principale</h2>
        <div className={s.cover}>
          {coverUrl ? <img src={coverUrl} alt="" className={s.coverImg} />
            : form.cover_path ? <span className={s.coverLocal}>Image du site : {form.cover_path.slice(6)}</span>
              : <span className={s.coverLocal}>Aucune image. 1200 px de large ou plus, pour Google Discover.</span>}
          <div className={s.coverActions}>
            <Button variant="secondary" size="small" onClick={() => coverInput.current?.click()} disabled={uploading}>
              <ImagePlus size={16} aria-hidden="true" />{form.cover_path ? 'Remplacer' : 'Choisir une image'}
            </Button>
            {form.cover_path && <Button variant="ghost" size="small" onClick={() => set('cover_path', null)}>Retirer</Button>}
          </div>
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={e => upload(e, 'cover')} />
        </div>
        {form.cover_path && (
          <div className={s.grid}>
            <TextField label="Description de l'image" value={form.cover_alt ?? ''} onChange={e => set('cover_alt', e.target.value)} error={show('cover_alt')} maxLength={200} />
            <TextField label="Légende" optional value={form.cover_caption ?? ''} onChange={e => set('cover_caption', e.target.value)} maxLength={200} />
          </div>
        )}
      </section>

      <section className={`panel ${s.bodyPanel}`}>
        <div className={s.bodyHead}>
          <h2 className={a.h3}>Texte</h2>
          <Segmented label="Mode" value={tab} onChange={setTab} options={[{ value: 'write', label: 'Écrire' }, { value: 'preview', label: 'Aperçu' }]} />
        </div>
        {tab === 'write' ? (
          <>
            <div className={s.toolbar} role="toolbar" aria-label="Mise en forme">
              <IconButton label="Intertitre" onClick={() => linePrefix('## ', 'Intertitre')}><Heading2 size={18} /></IconButton>
              <IconButton label="Sous-intertitre" onClick={() => linePrefix('### ', 'Sous-intertitre')}><Heading3 size={18} /></IconButton>
              <IconButton label="Gras" onClick={() => wrap('**', '**', 'texte')}><Bold size={18} /></IconButton>
              <IconButton label="Italique" onClick={() => wrap('*', '*', 'texte')}><Italic size={18} /></IconButton>
              <IconButton label="Lien" onClick={() => wrap('[', '](https://)', 'texte du lien')}><Link2 size={18} /></IconButton>
              <IconButton label="Liste" onClick={() => linePrefix('- ', 'élément')}><List size={18} /></IconButton>
              <IconButton label="Liste numérotée" onClick={() => linePrefix('1. ', 'étape')}><ListOrdered size={18} /></IconButton>
              <IconButton label="Citation" onClick={() => linePrefix('> ', 'citation')}><Quote size={18} /></IconButton>
              <IconButton label="Insérer une image" onClick={() => imageInput.current?.click()} disabled={uploading}><ImagePlus size={18} /></IconButton>
              <input ref={imageInput} type="file" accept="image/*" hidden onChange={e => upload(e, 'body')} />
              {uploading && <span className={a.small}>Envoi…</span>}
            </div>
            <TextArea label="Texte de l'article (Markdown)" className={s.bodyField} ref={bodyRef} value={form.body_md}
              onChange={e => set('body_md', e.target.value)} rows={22} spellCheck
              error={tried ? errors.body_md : null}
              hint="## pour un intertitre, **gras**, *italique*, [lien](https://…). Le titre de l'article n'est pas à répéter ici." />
          </>
        ) : (
          <article className={s.preview}>
            <h1>{form.title || 'Titre'}</h1>
            <p className={s.previewLead}>{form.description}</p>
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </article>
        )}
      </section>

      <div className={s.actions}>
        {id && <Button variant="danger" onClick={remove} disabled={busy}><Trash2 size={16} aria-hidden="true" />Supprimer</Button>}
        <span className={s.spacer} />
        {dirty && <span className={a.small}>Modifications non enregistrées</span>}
        {published ? (
          <>
            <Button variant="secondary" onClick={() => save('draft')} disabled={busy}>Retirer du site</Button>
            <Button type="submit" disabled={busy || !dirty}>Mettre à jour</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" type="submit" disabled={busy}>Enregistrer le brouillon</Button>
            <Button onClick={() => save('published')} disabled={busy}>Publier</Button>
          </>
        )}
      </div>
    </form>
  );
}
