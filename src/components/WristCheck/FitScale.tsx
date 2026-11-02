import { useState } from 'react';
import { Heart } from 'lucide-react';
import { setPhotoFit, togglePhotoLike } from '../../lib/api';
import type { FitChoice, PhotoFit } from '../../types';
import { defineStrings, useStrings } from '../../i18n';
import s from './WristCheck.module.css';

const S = defineStrings({
  question: 'Au poignet ?',
  small: 'Petite',
  perfect: 'Parfaite',
  large: 'Grande',
  result: (pct: number, n: number) => `Parfaite pour ${pct}\u00a0% · ${n} avis`,
  fewVotes: (n: number) => `${n} avis`,
  mine: 'votre vote',
  change: 'Modifier',
  like: 'J’aime',
  login: 'Connectez-vous pour donner votre avis.',
  own: 'Votre photo',
}, {
  question: 'On the wrist?',
  small: 'Small',
  perfect: 'Perfect',
  large: 'Large',
  result: (pct: number, n: number) => `Perfect for ${pct}% · ${n} votes`,
  fewVotes: (n: number) => `${n} votes`,
  mine: 'your vote',
  change: 'Change',
  like: 'Like',
  login: 'Sign in to give your opinion.',
  own: 'Your photo',
});

const total = (f: PhotoFit) => f.small + f.perfect + f.large;
export const perfectPct = (f: PhotoFit) => (total(f) ? Math.round((100 * f.perfect) / total(f)) : 0);

/** Score compact (grille de la galerie) : cœur et « Parfaite pour 78 % ». */
export function FitBadge({ fit, likes }: { fit: PhotoFit; likes: number }) {
  const t = useStrings(S);
  const n = total(fit);
  return (
    <span className={s.fitBadge}>
      {n > 0 && <span>{t.perfect} {perfectPct(fit)}&nbsp;%</span>}
      {likes > 0 && <span className={s.fitLikes}><Heart size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />{likes}</span>}
    </span>
  );
}

/**
 * « Au poignet ? » : Petite · Parfaite · Grande, et le cœur.
 * Avant le vote, les trois cases ; après, le résultat de la communauté et son propre vote (modifiable).
 */
export default function FitScale({ photoId, fit: initialFit, likes: initialLikes, liked: initialLiked, canVote, own }: {
  photoId: string; fit: PhotoFit; likes: number; liked: boolean; canVote: boolean; own?: boolean;
}) {
  const t = useStrings(S);
  const [fit, setFit] = useState(initialFit);
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const n = total(fit);
  const showResult = (fit.mine && !editing) || own || !canVote;

  const vote = async (choice: FitChoice) => {
    if (busy) return;
    setBusy(true);
    const prev = fit;
    // Réponse immédiate à l'écran, corrigée par la base
    const next = { ...fit, mine: choice } as PhotoFit;
    if (prev.mine) next[prev.mine] -= 1;
    next[choice] += 1;
    setFit(next); setEditing(false);
    try { const r = await setPhotoFit(photoId, choice); setFit(r.fit); setLikes(r.likes); }
    catch { setFit(prev); }
    setBusy(false);
  };
  const like = async () => {
    if (!canVote || busy) return;
    setLiked(!liked); setLikes(likes + (liked ? -1 : 1));
    try { const r = await togglePhotoLike(photoId); setLiked(r.liked); setLikes(r.likes); }
    catch { setLiked(liked); setLikes(likes); }
  };

  const heart = (
    <button type="button" className={s.heart} aria-pressed={liked} disabled={!canVote} onClick={like} aria-label={t.like}>
      <Heart size={17} fill={liked ? 'currentColor' : 'none'} strokeWidth={liked ? 0 : 1.8} aria-hidden="true" />{likes > 0 && <span>{likes}</span>}
    </button>
  );

  return (
    <div className={s.fit}>
      <div className={s.fitHead}>
        <span className={s.fitQuestion}>
          {showResult && n > 0 ? t.result(perfectPct(fit), n) : own ? t.own : !canVote ? t.login : t.question}
        </span>
        {heart}
      </div>
      {showResult ? (n > 0 && (
        <>
          <span className={s.meter} aria-hidden="true">
            <i style={{ flex: fit.small }} /><i data-mid style={{ flex: fit.perfect }} /><i style={{ flex: fit.large }} />
          </span>
          <span className={s.legend2}>
            {(['small', 'perfect', 'large'] as const).map(k => (
              <span key={k} data-mine={fit.mine === k}>
                {t[k]} {Math.round((100 * fit[k]) / n)}&nbsp;%{fit.mine === k && <> · {t.mine}</>}
              </span>
            ))}
          </span>
          {fit.mine && canVote && !own && <button type="button" className={s.change} onClick={() => setEditing(true)}>{t.change}</button>}
        </>
      )) : (
        <div className={s.scale} role="group" aria-label={t.question}>
          {(['small', 'perfect', 'large'] as const).map(k => (
            <button key={k} type="button" aria-pressed={fit.mine === k} onClick={() => vote(k)} disabled={busy}>{t[k]}</button>
          ))}
        </div>
      )}
    </div>
  );
}
