import { useCallback, useEffect, useRef, useState } from 'react';
import { FREE_WATCH_LIMIT, LAUNCH_MODE } from '../../lib/features';
import { LinkButton } from '../../components/ui';
import type { EcrinScene } from './scene/ecrinScene';
import { hasWebGL, prefersReducedMotion, useScrollVar } from './useScrollVar';
import s from './EcrinHero.module.css';

/**
 * Ouverture de l'écrin : la section fait trois écrans de haut, la scène reste fixée
 * pendant que le défilement ouvre le couvercle puis plonge vers une place libre.
 * Sans WebGL ou avec les animations réduites : une image fixe de l'écrin ouvert.
 */
export default function EcrinHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EcrinScene | null>(null);
  const [mode] = useState<'3d' | 'still'>(() => (prefersReducedMotion() || !hasWebGL() ? 'still' : '3d'));
  const [ready, setReady] = useState(false);

  const onProgress = useCallback((p: number) => {
    sceneRef.current?.setProgress(p);
    const el = sectionRef.current;
    if (el) el.dataset.stage = p < 0.16 ? 'a' : p > 0.8 ? 'c' : 'b';
  }, []);
  useScrollVar(sectionRef, { onChange: onProgress });

  useEffect(() => {
    if (mode !== '3d' || !canvasRef.current) return;
    let disposed = false;
    let scene: EcrinScene | null = null;
    const canvas = canvasRef.current;
    const low = window.innerWidth < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;

    import('./scene/ecrinScene').then(async ({ createEcrinScene }) => {
      await document.fonts?.ready;
      if (disposed) return;
      try {
        scene = createEcrinScene(canvas, { lowPower: low, onFirstFrame: () => setReady(true) });
      } catch {
        return; // l'image fixe reste affichée
      }
      sceneRef.current = scene;
      if (import.meta.env.DEV) (window as unknown as { __ecrin?: EcrinScene }).__ecrin = scene;
      const p = Number(getComputedStyle(sectionRef.current!).getPropertyValue('--p')) || 0;
      scene.setProgress(p, true);
      scene.start();
    });

    const onResize = () => scene?.resize();
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    // Hors de l'écran ou onglet masqué : on arrête le rendu
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) scene?.start(); else scene?.stop();
    });
    io.observe(sectionRef.current!);
    const onVis = () => (document.hidden ? scene?.stop() : scene?.start());

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [mode]);

  const cta = LAUNCH_MODE === 'waitlist'
    ? <LinkButton to="/#liste">Rejoindre la liste d'attente</LinkButton>
    : <LinkButton to="/signup">Créer mon écrin</LinkButton>;

  return (
    <section ref={sectionRef} data-stage="a" className={`${s.hero} ${mode === 'still' ? s.still : ''}`} aria-label="Présentation">
      <div className={s.stage}>
        <img className={s.poster} data-hidden={ready} src={mode === 'still' ? '/landing/ecrin-ouvert.webp' : '/landing/ecrin-ferme.webp'} alt="" />
        {mode === '3d' && <canvas ref={canvasRef} className={s.canvas} data-ready={ready} aria-hidden="true" />}
        <div className={s.vignette} aria-hidden="true" />

        <div className={`${s.copy} ${s.copyA}`}>
          <h1 className={s.title}>Chaque montre a sa&nbsp;place.</h1>
          <p className={s.lead}>
            The Box est l'écrin de votre collection : une fiche par montre, le jour où vous l'avez portée,
            ses entretiens, et des photos au poignet pour comparer avec d'autres collectionneurs.
          </p>
          <div className={s.ctas}>
            {cta}
            <LinkButton to="/galerie" variant="ghost">Voir la galerie</LinkButton>
          </div>
        </div>

        <div className={`${s.copy} ${s.copyB}`}>
          <h2 className={s.subtitle}>{FREE_WATCH_LIMIT} places, pour commencer.</h2>
          <p className={s.lead}>La collection gratuite accueille {FREE_WATCH_LIMIT} montres. Chaque coussin attend une fiche, des photos et une histoire.</p>
        </div>

        <div className={`${s.copy} ${s.copyC}`}>
          <h2 className={s.subtitle}>Laquelle rangerez-vous en premier&nbsp;?</h2>
          <div className={s.ctas}>{cta}</div>
        </div>

        <span className={s.cue} aria-hidden="true">Faites défiler pour ouvrir l'écrin</span>
      </div>
    </section>
  );
}
