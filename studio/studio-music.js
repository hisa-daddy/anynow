// Background music for the studio, made in the browser with Web Audio so there are no
// licensing questions. Each style is a fixed pattern, so the music for a given second is
// always the same: the preview can start anywhere and the export matches it.

const STYLES = {
  // Bright pop: I–V–vi–IV, four-on-the-floor kick, off-beat hats, plucked arpeggio.
  upbeat: {
    bpm: 118,
    chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    bass: [36, 31, 33, 29],
    kick: [0, 1, 2, 3], hat: [0.5, 1.5, 2.5, 3.5], snare: [1, 3],
    arp: 'square', pad: null,
  },
  // Slow and warm: seventh chords on a soft pad, light hats.
  chill: {
    bpm: 84,
    chords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]],
    bass: [33, 29, 36, 31],
    kick: [0, 2.5], hat: [1, 2, 3, 3.5], snare: [],
    arp: null, pad: 'sine',
  },
  // Koto-like plucks on a miyako-bushi scale over taiko-style hits.
  japanese: {
    bpm: 96,
    scale: [64, 65, 69, 71, 72, 76, 77, 81],
    phrase: [0, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5, 4, 3, 2, 3, 0],
    bass: [40, 40, 45, 45],
    taiko: [0, 1.5, 2], hat: [], snare: [],
  },
};

export const MUSIC = ['upbeat', 'chill', 'japanese', 'none'];

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Every note of the given style for `total` seconds, as { t, kind, ... }.
function notes(style, total) {
  const s = STYLES[style];
  if (!s) return [];
  const beat = 60 / s.bpm;
  const bar = beat * 4;
  const out = [];
  for (let b = 0; b * bar < total; b++) {
    const t0 = b * bar;
    const ci = b % 4;
    for (const k of s.kick || []) out.push({ t: t0 + k * beat, kind: 'kick' });
    for (const k of s.taiko || []) out.push({ t: t0 + k * beat, kind: 'taiko' });
    for (const k of s.hat) out.push({ t: t0 + k * beat, kind: 'hat' });
    for (const k of s.snare) out.push({ t: t0 + k * beat, kind: 'snare' });
    out.push({ t: t0, kind: 'tone', wave: 'triangle', f: hz(s.bass[ci]), d: bar * 0.9, v: 0.32 });
    if (s.chords && s.arp) {
      const ch = s.chords[ci];
      for (let n = 0; n < 8; n++) {
        out.push({ t: t0 + n * beat / 2, kind: 'pluck', wave: s.arp, f: hz(ch[n % ch.length] + (n >= 4 ? 12 : 0)), d: beat * 0.45, v: 0.07 });
      }
    }
    if (s.chords && s.pad) {
      for (const m of s.chords[ci]) out.push({ t: t0, kind: 'tone', wave: s.pad, f: hz(m), d: bar, v: 0.07, attack: 0.4 });
    }
    if (s.scale) {
      for (let n = 0; n < 8; n++) {
        const step = s.phrase[(b % 2) * 8 + n];
        if (n % 4 === 3 && b % 2) continue; // breathe
        out.push({ t: t0 + n * beat / 2, kind: 'pluck', wave: 'triangle', f: hz(s.scale[step]), d: beat * 1.2, v: 0.16 });
      }
    }
  }
  return out.filter((n) => n.t < total);
}

const noiseCache = new WeakMap();
function noise(ctx) {
  if (!noiseCache.has(ctx)) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return noiseCache.get(ctx);
}

function voice(ctx, out, n, at) {
  const g = ctx.createGain();
  g.connect(out);
  if (n.kind === 'kick' || n.kind === 'taiko') {
    const o = ctx.createOscillator();
    const [hi, lo, len, vol] = n.kind === 'kick' ? [150, 45, 0.28, 0.9] : [110, 48, 0.6, 0.8];
    o.frequency.setValueAtTime(hi, at);
    o.frequency.exponentialRampToValueAtTime(lo, at + len * 0.5);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(g);
    o.start(at);
    o.stop(at + len + 0.02);
    return;
  }
  if (n.kind === 'hat' || n.kind === 'snare') {
    const src = ctx.createBufferSource();
    src.buffer = noise(ctx);
    const f = ctx.createBiquadFilter();
    f.type = n.kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = n.kind === 'hat' ? 7000 : 1800;
    const [len, vol] = n.kind === 'hat' ? [0.05, 0.12] : [0.16, 0.22];
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + len);
    src.connect(f).connect(g);
    src.start(at);
    src.stop(at + len + 0.02);
    return;
  }
  const o = ctx.createOscillator();
  o.type = n.wave;
  o.frequency.setValueAtTime(n.f, at);
  const attack = n.attack ?? (n.kind === 'pluck' ? 0.005 : 0.02);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(n.v, at + attack);
  if (n.kind === 'pluck') g.gain.exponentialRampToValueAtTime(0.0001, at + n.d);
  else {
    g.gain.setValueAtTime(n.v, at + Math.max(attack, n.d - 0.15));
    g.gain.linearRampToValueAtTime(0.0001, at + n.d);
  }
  o.connect(g);
  o.start(at);
  o.stop(at + n.d + 0.05);
}

// Plays the style from timeline second `from`, with timeline 0 at audio time `zeroAt`.
// Sends to every node in `outputs`. Fades out over the last 1.5 s. Returns stop().
export function playMusic(ctx, style, total, from, zeroAt, outputs) {
  const master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  for (const o of outputs) comp.connect(o);
  const vol = 0.55;
  const fadeStart = Math.max(from, total - 1.5);
  master.gain.setValueAtTime(vol, zeroAt + from);
  master.gain.setValueAtTime(vol, zeroAt + fadeStart);
  master.gain.linearRampToValueAtTime(0.0001, zeroAt + total);
  for (const n of notes(style, total)) {
    if (n.t >= from - 0.001) voice(ctx, master, n, zeroAt + n.t);
  }
  return () => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.05);
    setTimeout(() => comp.disconnect(), 120);
  };
}
