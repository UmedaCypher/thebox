/*
 * Enregistrement brut du micro (sans compression ni traitement) pour le timegrapher.
 * Les traitements du téléphone (annulation d'écho, réduction de bruit, gain automatique) sont coupés :
 * ils effaceraient justement les clics de l'échappement.
 */
const WORKLET = `
class Collect extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor('arcora-collect', Collect);
`;

export interface Recording {
  stop: () => Promise<{ samples: Float32Array; sampleRate: number }>;
  /** Niveau instantané (0 à 1) pour l'affichage. */
  level: () => number;
  /** Les derniers échantillons, pour dessiner l'onde. */
  tail: (n: number) => Float32Array;
}

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
  });
  const ctx = new AudioContext();
  const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
  await ctx.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'arcora-collect');
  const chunks: Float32Array[] = [];
  let total = 0, last = 0;
  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    chunks.push(e.data); total += e.data.length;
    let m = 0; for (let i = 0; i < e.data.length; i++) m = Math.max(m, Math.abs(e.data[i]));
    last = last * 0.85 + m * 0.15;
  };
  src.connect(node);
  // Le nœud doit être relié à la sortie pour être cadencé ; gain nul : rien n'est joué
  const mute = ctx.createGain(); mute.gain.value = 0; node.connect(mute).connect(ctx.destination);

  return {
    level: () => Math.min(1, last * 4),
    tail: (n: number) => {
      const out = new Float32Array(n); let j = n;
      for (let c = chunks.length - 1; c >= 0 && j > 0; c--) {
        const ch = chunks[c];
        for (let i = ch.length - 1; i >= 0 && j > 0; i--) out[--j] = ch[i];
      }
      return out;
    },
    stop: async () => {
      stream.getTracks().forEach(tr => tr.stop());
      node.port.onmessage = null;
      src.disconnect(); node.disconnect();
      const sampleRate = ctx.sampleRate;
      await ctx.close();
      const samples = new Float32Array(total); let o = 0;
      for (const c of chunks) { samples.set(c, o); o += c.length; }
      return { samples, sampleRate };
    },
  };
}
