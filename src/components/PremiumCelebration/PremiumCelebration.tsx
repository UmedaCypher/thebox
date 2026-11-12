import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFoundersOffer } from '../../lib/api';
import { FREE_WATCH_LIMIT } from '../../lib/features';
import { Button } from '../ui';
import { defineStrings, useStrings } from '../../i18n';
import s from './PremiumCelebration.module.css';

/*
 * Retour de paiement Stripe : un moment à part plutôt qu'un bandeau.
 * Pendant que le webhook active Premium (quelques secondes), une trotteuse balaie le cadran ;
 * à l'activation, les aiguilles se posent sur 10 h 10, l'anneau de laiton s'illumine
 * et des feuilles d'or tombent. Sans animation si le membre l'a demandé (prefers-reduced-motion).
 */

const S = defineStrings({
  waitingEyebrow: 'Paiement reçu',
  waitingTitle: 'Activation de Premium…',
  waitingText: 'Quelques secondes, le temps que Stripe nous confirme le paiement.',
  slowTitle: 'Presque prêt',
  slowText: 'Votre paiement est bien reçu, l’activation prend un peu plus de temps que prévu. Rechargez la page dans une minute.',
  eyebrow: 'Paiement confirmé',
  title: 'Bienvenue dans Premium',
  thanks: (name: string | null) => `Merci${name ? `, @${name}` : ''}. Votre soutien fait vivre Arcora, et votre collection n’a plus de limite.`,
  founder: (n: number | null) => (n ? `Membre fondateur · n° ${n} sur 100` : 'Membre fondateur'),
  unlocked: 'Ce qui vient de s’ouvrir',
  perks: [
    `Collection illimitée, au-delà de ${FREE_WATCH_LIMIT} montres`,
    'Coût par port et montres dormantes',
    'Carnet d’entretien et rappels de révision',
    'Export assurance et suivi de valeur',
  ],
  addWatch: 'Ajouter une montre',
  explore: 'Voir ma collection',
  close: 'Fermer',
  reload: 'Recharger la page',
}, {
  waitingEyebrow: 'Payment received',
  waitingTitle: 'Activating Premium…',
  waitingText: 'Just a few seconds while Stripe confirms the payment.',
  slowTitle: 'Almost there',
  slowText: 'Your payment went through; activation is taking a little longer than usual. Reload the page in a minute.',
  eyebrow: 'Payment confirmed',
  title: 'Welcome to Premium',
  thanks: (name: string | null) => `Thank you${name ? `, @${name}` : ''}. Your support keeps Arcora going, and your collection now has no limit.`,
  founder: (n: number | null) => (n ? `Founding member · no. ${n} of 100` : 'Founding member'),
  unlocked: 'What just opened up',
  perks: [
    `Unlimited collection, beyond ${FREE_WATCH_LIMIT} watches`,
    'Cost per wear and dormant watches',
    'Service log and service reminders',
    'Insurance export and value tracking',
  ],
  addWatch: 'Add a watch',
  explore: 'See my collection',
  close: 'Close',
  reload: 'Reload the page',
});

export type CelebrationStatus = 'waiting' | 'done' | 'slow';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PremiumCelebration({ status, onClose }: { status: CelebrationStatus; onClose: () => void }) {
  const t = useStrings(S);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const canvas = useRef<HTMLCanvasElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [founder, setFounder] = useState<{ n: number | null } | null>(null);
  const done = status === 'done';

  // Membre fondateur : la place prise (le compteur au moment du paiement)
  useEffect(() => {
    if (!done) return;
    getFoundersOffer().then(o => { if (o?.claimed) setFounder({ n: o.taken || null }); }).catch(() => {});
  }, [done]);

  // Fermeture au clavier, défilement de la page bloqué derrière
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Activation : petit retour haptique, focus sur le titre, pluie de feuilles d'or
  useEffect(() => {
    if (!done) return;
    heading.current?.focus();
    try { navigator.vibrate?.([18, 60, 28]); } catch { /* sans vibreur */ }
    if (reducedMotion() || !canvas.current) return;
    return goldLeaf(canvas.current);
  }, [done]);

  const title = done ? t.title : status === 'slow' ? t.slowTitle : t.waitingTitle;
  const eyebrow = done ? t.eyebrow : t.waitingEyebrow;

  return createPortal(
    <div className={s.overlay} data-status={status} role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <canvas ref={canvas} className={s.leaf} aria-hidden="true" />
      <button type="button" className={s.close} onClick={onClose} aria-label={t.close}><X size={20} /></button>

      <div className={s.stage}>
        <Dial status={status} />

        <div className={s.copy} aria-live="polite">
          <p className={s.eyebrow}>{eyebrow}</p>
          <h1 id="celebration-title" ref={heading} tabIndex={-1} className={s.title}>{title}</h1>
          {done ? (
            <>
              <p className={s.thanks}>{t.thanks(profile?.username ?? null)}</p>
              {founder && <p className={s.founder}>{t.founder(founder.n)}</p>}
              <section className={s.perks} aria-label={t.unlocked}>
                <p className={s.perksTitle}>{t.unlocked}</p>
                <ul>
                  {t.perks.map((p, i) => (
                    <li key={p} style={{ animationDelay: `${1.5 + i * 0.12}s` }}>
                      <span className={s.check}><Check size={14} strokeWidth={2.4} aria-hidden="true" /></span>{p}
                    </li>
                  ))}
                </ul>
              </section>
              <div className={s.actions}>
                <Button onClick={() => { onClose(); navigate('/ajouter-montre'); }}>{t.addWatch}</Button>
                <Button variant="ghost" onClick={() => { onClose(); navigate('/collection'); }}>{t.explore}</Button>
              </div>
            </>
          ) : (
            <>
              <p className={s.thanks}>{status === 'slow' ? t.slowText : t.waitingText}</p>
              {status === 'slow' && (
                <div className={s.actions}>
                  <Button onClick={() => window.location.reload()}>{t.reload}</Button>
                  <Button variant="ghost" onClick={onClose}>{t.close}</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Cadran laiton : trotteuse qui balaie pendant l'attente, aiguilles sur 10 h 10 à l'activation. */
function Dial({ status }: { status: CelebrationStatus }) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className={s.dial} data-status={status} aria-hidden="true">
      <span className={s.halo} />
      <svg viewBox="0 0 200 200" className={s.dialSvg}>
        <defs>
          <linearGradient id="cel-brass" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="180" y2="190">
            <stop offset="0" stopColor="#f3dfb8" />
            <stop offset="0.45" stopColor="#c2a072" />
            <stop offset="1" stopColor="#7d5f37" />
          </linearGradient>
          <radialGradient id="cel-face" cx="50%" cy="38%" r="70%">
            <stop offset="0" stopColor="#3a1b20" />
            <stop offset="1" stopColor="#140809" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="94" fill="url(#cel-face)" />
        <circle className={s.ring} cx="100" cy="100" r="94" fill="none" stroke="url(#cel-brass)" strokeWidth="4" pathLength={1} />
        {ticks.map(i => {
          const hour = i % 5 === 0;
          const a = (i * 6 * Math.PI) / 180;
          const r1 = hour ? 72 : 80, r2 = 86;
          return (
            <line key={i} x1={100 + r1 * Math.sin(a)} y1={100 - r1 * Math.cos(a)} x2={100 + r2 * Math.sin(a)} y2={100 - r2 * Math.cos(a)}
              stroke={hour ? 'url(#cel-brass)' : 'rgba(239,232,220,0.28)'} strokeWidth={hour ? 3 : 1} strokeLinecap="round" />
          );
        })}
        <text x="100" y="66" textAnchor="middle" className={s.dialName}>ARCORA</text>
        <text x="100" y="142" textAnchor="middle" className={s.dialSub}>PREMIUM</text>
        <g className={s.hour}><line x1="100" y1="100" x2="100" y2="58" stroke="url(#cel-brass)" strokeWidth="5" strokeLinecap="round" /></g>
        <g className={s.minute}><line x1="100" y1="100" x2="100" y2="34" stroke="url(#cel-brass)" strokeWidth="3.4" strokeLinecap="round" /></g>
        <g className={s.second}>
          <line x1="100" y1="116" x2="100" y2="26" stroke="#c9e7a7" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="100" cy="26" r="2.6" fill="#c9e7a7" />
        </g>
        <circle cx="100" cy="100" r="5" fill="url(#cel-brass)" />
      </svg>
      <span className={s.sheen} />
    </div>
  );
}

/** Feuilles d'or : une gerbe depuis le cadran, puis une pluie lente qui s'éteint. Renvoie la fonction d'arrêt. */
function goldLeaf(el: HTMLCanvasElement) {
  const ctx = el.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => { el.width = innerWidth * dpr; el.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize();
  window.addEventListener('resize', resize);
  const COLORS = ['#f3dfb8', '#e2c48f', '#c2a072', '#a8854f', '#fff4dc'];
  type Leaf = { x: number; y: number; vx: number; vy: number; s: number; r: number; vr: number; flip: number; vf: number; c: string; life: number };
  const leaves: Leaf[] = [];
  const cx = innerWidth / 2, cy = Math.min(innerHeight * 0.3, 260);
  const add = (burst: boolean) => {
    const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 7;
    leaves.push({
      x: burst ? cx : Math.random() * innerWidth, y: burst ? cy : -20,
      vx: burst ? Math.cos(a) * sp : (Math.random() - 0.5) * 0.6, vy: burst ? Math.sin(a) * sp - 3 : 1 + Math.random() * 1.2,
      s: 4 + Math.random() * 7, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
      flip: Math.random() * Math.PI, vf: 0.06 + Math.random() * 0.1, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1,
    });
  };
  for (let i = 0; i < 110; i++) add(true);
  const start = performance.now();
  let raf = 0, last = start;
  const frame = (now: number) => {
    const dt = Math.min(2, (now - last) / 16.7); last = now;
    const age = now - start;
    if (age < 3800 && Math.random() < 0.55) add(false);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i];
      l.vx *= 0.985; l.vy = l.vy * 0.985 + 0.06 * dt; // air, puis gravité douce
      l.x += l.vx * dt + Math.sin(l.flip) * 0.4; l.y += l.vy * dt;
      l.r += l.vr * dt; l.flip += l.vf * dt;
      if (age > 4200) l.life -= 0.012 * dt;
      if (l.y > innerHeight + 30 || l.life <= 0) { leaves.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, l.life) * 0.95;
      ctx.translate(l.x, l.y); ctx.rotate(l.r); ctx.scale(Math.cos(l.flip), 1); // la feuille tourne sur elle-même
      ctx.fillStyle = l.c;
      ctx.beginPath(); ctx.moveTo(0, -l.s); ctx.lineTo(l.s * 0.7, 0); ctx.lineTo(0, l.s * 0.9); ctx.lineTo(-l.s * 0.6, 0); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (leaves.length || age < 4200) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}
