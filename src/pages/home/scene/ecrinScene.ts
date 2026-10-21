/**
 * Scène 3D de l'accueil : un écrin en cuir qui s'ouvre au défilement
 * sur six coussins de velours vides, qui attendent la collection du visiteur.
 *
 * API : setProgress(0..1) suit le défilement, setPointer(-1..1) la souris ou l'inclinaison.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { dustSprite, leatherBump, plaqueTexture, velvetBump, velvetTint } from './textures';

export interface EcrinScene {
  setProgress(p: number, immediate?: boolean): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

interface Options { lowPower?: boolean; onFirstFrame?: () => void }

// Dimensions (unité arbitraire, ~ 5 cm)
const BOX_W = 6.6, BOX_D = 4.7, TRAY_H = 1.25, WALL = 0.26, LID_H = 0.42;
const CUSHION_TOP = 1.1;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------------------------------------------------------------- matériaux */

function materials() {
  const leatherMap = leatherBump();
  const velvetMap = velvetBump();
  const tint = velvetTint();
  return {
    leather: new THREE.MeshPhysicalMaterial({
      color: '#2a0c11', roughness: 0.58, clearcoat: 0.45, clearcoatRoughness: 0.5,
      bumpMap: leatherMap, bumpScale: 0.12,
    }),
    velvet: new THREE.MeshPhysicalMaterial({
      color: '#300a12', map: tint, roughness: 1, sheen: 1, sheenColor: new THREE.Color('#8f4552'), sheenRoughness: 0.3,
      bumpMap: velvetMap, bumpScale: 1.2,
    }),
    velvetDark: new THREE.MeshPhysicalMaterial({
      color: '#1c050a', roughness: 1, sheen: 0.7, sheenColor: new THREE.Color('#7a3a45'), sheenRoughness: 0.5,
      bumpMap: velvetMap, bumpScale: 0.3,
    }),
    brass: new THREE.MeshStandardMaterial({ color: '#c9a66d', metalness: 1, roughness: 0.32 }),
  };
}
type Mats = ReturnType<typeof materials>;

/* ---------------------------------------------------------------- coussin */

/**
 * Coussin bombé : une boîte très subdivisée, gonflée au centre et arrondie sur les bords,
 * comme un coussin de velours rembourré.
 */
function pillowGeometry(w: number, h: number, d: number) {
  const geo = new THREE.BoxGeometry(2, 2, 2, 28, 10, 28);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ax = Math.abs(v.x), az = Math.abs(v.z);
    // Bords arrondis : on rapproche du centre ce qui est près du haut et du bas
    const pinch = 1 - 0.22 * Math.pow(Math.abs(v.y), 3);
    // Coins adoucis (super-ellipse)
    const corner = 1 - 0.06 * Math.pow(ax * az, 2);
    v.x *= pinch * corner;
    v.z *= pinch * corner;
    // Dessus gonflé
    if (v.y > 0) v.y *= 0.55 + 0.75 * (1 - ax * ax * 0.85) * (1 - az * az * 0.85);
    else v.y *= 0.55;
    p.setXYZ(i, v.x * w / 2, v.y * h / 2, v.z * d / 2);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Couture : points de piqûre en laiton le long d'un rectangle. */
function seam(w: number, d: number, y: number) {
  const pts = [new THREE.Vector3(-w / 2, y, -d / 2), new THREE.Vector3(w / 2, y, -d / 2), new THREE.Vector3(w / 2, y, d / 2), new THREE.Vector3(-w / 2, y, d / 2), new THREE.Vector3(-w / 2, y, -d / 2)];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: '#b8935c', dashSize: 0.07, gapSize: 0.06, transparent: true, opacity: 0.85 }));
  line.computeLineDistances();
  return line;
}

/* ---------------------------------------------------------------- écrin */

function buildBox(m: Mats) {
  const box = new THREE.Group();

  // Plateau : fond et parois en cuir
  const base = new THREE.Mesh(new RoundedBoxGeometry(BOX_W, 0.3, BOX_D, 4, 0.12), m.leather);
  base.position.y = 0.15;
  base.receiveShadow = base.castShadow = true;
  box.add(base);
  const wallFB = new RoundedBoxGeometry(BOX_W, TRAY_H, WALL, 4, 0.1);
  const wallLR = new RoundedBoxGeometry(WALL, TRAY_H, BOX_D, 4, 0.1);
  for (const [geo, x, z] of [[wallFB, 0, BOX_D / 2 - WALL / 2], [wallFB, 0, -BOX_D / 2 + WALL / 2], [wallLR, BOX_W / 2 - WALL / 2, 0], [wallLR, -BOX_W / 2 + WALL / 2, 0]] as const) {
    const w = new THREE.Mesh(geo, m.leather);
    w.position.set(x, TRAY_H / 2, z);
    w.castShadow = w.receiveShadow = true;
    box.add(w);
  }
  // Fond intérieur en velours
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W - WALL * 2, BOX_D - WALL * 2), m.velvetDark);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.31;
  floor.receiveShadow = true;
  box.add(floor);

  // Coussins : 3 × 2
  const cushions: THREE.Vector3[] = [];
  const cw = (BOX_W - WALL * 2 - 0.36) / 3, cd = (BOX_D - WALL * 2 - 0.3) / 2;
  const cushionGeo = pillowGeometry(cw - 0.08, 0.86, cd - 0.1);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -cw + c * (cw + 0.09);
      const z = -cd / 2 - 0.06 + r * (cd + 0.12);
      const cu = new THREE.Mesh(cushionGeo, m.velvet);
      cu.position.set(x, 0.31 + 0.24, z);
      cu.castShadow = cu.receiveShadow = true;
      box.add(cu);
      cushions.push(new THREE.Vector3(x, CUSHION_TOP, z));
    }
  }

  // Couvercle (pivot sur l'arête arrière)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, TRAY_H, -BOX_D / 2);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(BOX_W, LID_H, BOX_D, 5, 0.16), m.leather);
  lid.position.set(0, LID_H / 2, BOX_D / 2);
  lid.castShadow = lid.receiveShadow = true;
  lidPivot.add(lid);
  const lining = new THREE.Mesh(new THREE.PlaneGeometry(BOX_W - WALL * 2, BOX_D - WALL * 2), m.velvet);
  lining.rotation.x = Math.PI / 2;
  lining.position.set(0, -0.002, BOX_D / 2);
  lidPivot.add(lining);
  const plaque = new THREE.Mesh(
    new RoundedBoxGeometry(1.25, 0.03, 0.42, 2, 0.012),
    new THREE.MeshStandardMaterial({ map: plaqueTexture(), metalness: 1, roughness: 0.3 }),
  );
  plaque.position.set(0, LID_H + 0.012, BOX_D - 0.75);
  lidPivot.add(plaque);
  const lidSeam = seam(BOX_W - 0.34, BOX_D - 0.34, LID_H + 0.004);
  lidSeam.position.z = BOX_D / 2;
  lidPivot.add(lidSeam);
  box.add(lidPivot);

  // Charnières et fermoir
  for (const x of [-BOX_W / 3, BOX_W / 3]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 20), m.brass);
    h.rotation.z = Math.PI / 2;
    h.position.set(x, TRAY_H, -BOX_D / 2 - 0.02);
    box.add(h);
  }
  const clasp = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.3, 0.06, 2, 0.02), m.brass);
  clasp.position.set(0, TRAY_H - 0.05, BOX_D / 2 + 0.02);
  box.add(clasp);

  return { box, lidPivot, cushions };
}

/* ---------------------------------------------------------------- poussière */

function buildDust(count: number) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(Math.random()) * 3.2;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 0.5 + Math.random() * 5.5;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.8;
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.05, map: dustSprite(), transparent: true, opacity: 0.55, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, color: '#ffd9a8',
  });
  const points = new THREE.Points(geo, mat);
  return { points, base: pos.slice(), seed };
}

/* ---------------------------------------------------------------- scène */

// Le coussin vers lequel la caméra plonge : avant-centre.
const HERO_SLOT = 4;

export function createEcrinScene(canvasEl: HTMLCanvasElement, opts: Options = {}): EcrinScene {
  const low = Boolean(opts.lowPower);
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: !low, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#140709');
  scene.fog = new THREE.Fog('#140709', 11, 24);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  // Lumières : un faisceau chaud de vitrine, une contre-lumière froide, une lueur dans l'écrin
  const spot = new THREE.SpotLight('#ffe2bd', 260, 30, 0.42, 0.75, 1.6);
  spot.position.set(1.6, 11, 5.2);
  spot.target.position.set(0, 0.8, 0.3);
  spot.castShadow = true;
  spot.shadow.mapSize.set(low ? 512 : 1536, low ? 512 : 1536);
  spot.shadow.bias = -0.0004;
  spot.shadow.radius = 6;
  scene.add(spot, spot.target);
  const rim = new THREE.DirectionalLight('#9fb4ff', 0.35);
  rim.position.set(-6, 4, -6);
  scene.add(rim);
  scene.add(new THREE.AmbientLight('#3a1a1e', 0.6));
  const glow = new THREE.PointLight('#ffcf9a', 0, 6, 1.8);
  // Faisceau qui désigne la place libre à la fin
  const pick = new THREE.SpotLight('#ffe7c4', 0, 12, 0.16, 0.6, 1.4);
  scene.add(pick, pick.target);
  glow.position.set(0, 1.6, 0.4);
  scene.add(glow);

  // Table
  const table = new THREE.Mesh(
    new THREE.CircleGeometry(40, 64),
    new THREE.MeshStandardMaterial({ color: '#1d0b0e', roughness: 0.85, metalness: 0 }),
  );
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  const m = materials();
  const { box, lidPivot, cushions } = buildBox(m);
  scene.add(box);

  const heroPos = cushions[HERO_SLOT].clone();
  pick.position.set(heroPos.x + 0.6, 8, heroPos.z + 1.2);
  pick.target.position.copy(heroPos);

  const dust = buildDust(low ? 160 : 420);
  scene.add(dust.points);

  /* ---- état ---- */
  let progress = 0, shown = 0;
  const pointer = new THREE.Vector2(), pointerSmooth = new THREE.Vector2();
  let raf = 0, running = false, first = true, lastShift = -1;
  const clock = new THREE.Clock();
  const target = new THREE.Vector3();

  const frame = () => {
    raf = running ? requestAnimationFrame(frame) : 0;
    const t = clock.getElapsedTime();
    shown += (progress - shown) * 0.09;
    pointerSmooth.lerp(pointer, 0.05);
    const p = shown;

    // Couvercle : entrouvert au repos (un filet de lumière), puis grand ouvert
    const breathe = (Math.sin(t * 1.4) * 0.5 + 0.5) * 0.04;
    const open = smooth(0.08, 0.55, p);
    lidPivot.rotation.x = -(0.035 + breathe * (1 - open) + open * 1.92);
    glow.intensity = 3 + open * 7;
    pick.intensity = smooth(0.7, 1, p) * 140;
    spot.intensity = 260 - smooth(0.7, 1, p) * 120;

    // Caméra : face à l'écrin, puis au-dessus, puis plongée sur la montre principale
    const aspect = camera.aspect;
    const fit = aspect < 1 ? Math.min(2.1, 1.05 / aspect) : 1;
    // En portrait, l'écrin fermé est dessiné plus bas, sous le titre (décalage de la projection).
    const settle = 1 - smooth(0.05, 0.4, p);
    const shiftY = aspect < 1 ? 0.24 * settle : 0;
    const shiftX = aspect > 1.15 ? -0.17 * settle : 0; // écran large : l'écrin à droite du titre
    const fog = scene.fog as THREE.Fog;
    fog.near = 11 * fit; fog.far = 24 * fit;
    const a = smooth(0.0, 0.55, p), b = smooth(0.58, 1, p);
    // Sur écran large, l'écrin fermé se place à droite du titre ; il revient au centre en s'ouvrant.
    const side = 0;
    const fit0 = aspect < 1 ? Math.min(2.7, 1.25 / aspect) : 1;
    const p0 = new THREE.Vector3(side, 5.6 * Math.max(1, fit0 * 0.8), (aspect > 1.15 ? 16 : 10.6) * fit0), p1 = new THREE.Vector3(0, 9.2 * Math.min(fit, 1.9), 6.4 * Math.min(fit, 1.9));
    const p2 = new THREE.Vector3(heroPos.x + 0.15, heroPos.y + 3.3 * Math.min(fit, 1.75), heroPos.z + 2.9 * Math.min(fit, 1.75));
    const t0 = new THREE.Vector3(side, 1.0, 0), t1 = new THREE.Vector3(0, 0.6, 0.15), t2 = new THREE.Vector3(heroPos.x, heroPos.y + 0.15, heroPos.z);
    camera.position.set(lerp(lerp(p0.x, p1.x, a), p2.x, b), lerp(lerp(p0.y, p1.y, a), p2.y, b), lerp(lerp(p0.z, p1.z, a), p2.z, b));
    target.set(lerp(lerp(t0.x, t1.x, a), t2.x, b), lerp(lerp(t0.y, t1.y, a), t2.y, b), lerp(lerp(t0.z, t1.z, a), t2.z, b));
    const par = 1 - b * 0.7;
    camera.position.x += pointerSmooth.x * 0.6 * par;
    camera.position.y += pointerSmooth.y * 0.35 * par;
    camera.lookAt(target);
    const shiftKey = shiftX * 1000 + shiftY;
    if (Math.abs(shiftKey - lastShift) > 0.0005) {
      lastShift = shiftKey;
      const w = canvasEl.clientWidth || 1, h = canvasEl.clientHeight || 1;
      if (Math.abs(shiftX) + shiftY > 0.0005) camera.setViewOffset(w, h, w * shiftX, -h * shiftY, w, h); else camera.clearViewOffset();
    }

    // Rotation lente de l'écrin au repos
    box.rotation.y = (1 - a) * (Math.sin(t * 0.25) * 0.06 - 0.08);

    // Poussière : dérive lente dans le faisceau
    const arr = dust.points.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < dust.seed.length; i++) {
      const s = dust.seed[i];
      arr[i * 3] = dust.base[i * 3] + Math.sin(t * 0.17 + s) * 0.35;
      arr[i * 3 + 1] = 0.4 + ((dust.base[i * 3 + 1] + t * 0.06 * (0.5 + (s % 1))) % 7.2);
      arr[i * 3 + 2] = dust.base[i * 3 + 2] + Math.cos(t * 0.13 + s) * 0.3;
    }
    dust.points.geometry.attributes.position.needsUpdate = true;
    (dust.points.material as THREE.PointsMaterial).opacity = 0.5 * (1 - b * 0.6);

    renderer.render(scene, camera);
    if (first) { first = false; opts.onFirstFrame?.(); }
  };

  const api: EcrinScene = {
    setProgress(v, immediate) { progress = Math.min(1, Math.max(0, v)); if (immediate) shown = progress; },
    setPointer(x, y) { pointer.set(x, y); },
    resize() {
      const w = canvasEl.clientWidth || window.innerWidth, h = canvasEl.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      lastShift = -1;
      camera.updateProjectionMatrix();
    },
    start() { if (!running) { running = true; clock.start(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    dispose() {
      api.stop();
      scene.traverse(o => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(mm => {
          Object.values(mm).forEach(v => { if (v instanceof THREE.Texture) v.dispose(); });
          mm.dispose();
        });
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
  api.resize();
  return api;
}
