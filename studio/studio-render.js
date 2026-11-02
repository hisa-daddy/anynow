// Draws one frame of a restaurant's short video onto a 9:16 canvas. The same function runs
// the preview and the export, so what the owner sees is exactly what gets recorded.
//
// Modeled on the restaurant videos EatNow already has (Tomo Sushi, Teramae, Dragon Borracho):
// real shots one after another, plain white words with a soft shadow in the middle of the
// screen (no boxes), the same words can stay up across several shots, dishes can be shown
// together as a collage, and the last shot carries the shop name and a closing line.
// The bottom of the screen stays clear: the feed puts the shop name and tags there.

export const W = 720;
export const H = 1280;
export const INTRO = 2.6; // seconds the shop name stays over the opening
export const TRANSITIONS = { fade: 0.5, cut: 0 }; // seconds each shot takes to fade in

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
const TITLE_Y = 0.42; // middle of the shop name block, as a share of the height
const CAPTION_Y = 0.56;

// Word styles. Picking one also suggests a transition (the owner can change it); music starts off.
//  elegant: light words and a gold sparkle arc (like Tomo Sushi)
//  simple:  bold words, soft fades (like Teramae)
//  lively:  heavy capitals that pop in, hard cuts (like Dragon Borracho)
export const LOOKS = {
  elegant: { title: [92, 500], sub: [38, 400], caption: [60, 400], upper: false, spacing: 1, pop: false, sparkle: true, vertical: true, transition: 'fade' },
  simple: { title: [92, 800], sub: [38, 600], caption: [54, 800], upper: false, spacing: 0, pop: false, sparkle: false, vertical: false, transition: 'fade' },
  lively: { title: [100, 900], sub: [40, 800], caption: [64, 900], upper: true, spacing: 0, pop: true, sparkle: false, vertical: false, transition: 'cut' },
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const CJK = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

// Short words go big and long sentences smaller, as in the reference videos
// ("A buzzing atmosphere" fills the screen; "You're bound to find a dish…" is small).
// Japanese characters count double, being about twice as wide.
function fitSize([size, weight], text) {
  const len = [...text].reduce((n, ch) => n + (CJK.test(ch) ? 2 : 1), 0);
  const k = len <= 14 ? 1.3 : len <= 26 ? 1 : len <= 40 ? 0.8 : 0.7;
  return [Math.round(size * k), weight];
}

// The Japanese name written top to bottom under the shop name (elegant look, like Tomo Sushi's 伴寿司).
function vertical(ctx, text, top, alpha) {
  const chars = [...String(text).replace(/\s+/g, '')].slice(0, 6);
  if (!chars.length || alpha <= 0) return;
  const size = 58;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `400 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  chars.forEach((ch, k) => ctx.fillText(ch, W / 2, top + size * (k + 0.5) * 1.08));
  ctx.restore();
}
const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;

// Start and end of each shot, and for each shot the run of neighbours showing the same words
// (so a caption stays up, without blinking, across shots that share it). The last shot shows
// the closing words instead of a caption.
export function timeline(clips, transition = 'fade') {
  const fade = TRANSITIONS[transition] ?? TRANSITIONS.fade;
  let t = 0;
  const segments = clips.map((clip) => {
    const seg = { clip, start: t, end: t + clip.dur };
    t = seg.end;
    return seg;
  });
  const words = (i) => (i < segments.length - 1 ? segments[i].clip.caption?.trim() || '' : '');
  segments.forEach((seg, i) => {
    let a = i;
    let b = i;
    while (a > 0 && words(a - 1) && words(a - 1) === words(i)) a--;
    while (b < segments.length - 2 && words(b + 1) && words(b + 1) === words(i)) b++;
    seg.run = { start: segments[a].start, end: segments[b].end };
  });
  return { segments, total: t, fade };
}

// Where a video shot's source should be at timeline time t (it keeps playing through the next fade).
export function sourceTime(seg, t) {
  const { clip } = seg;
  const local = Math.max(0, t - seg.start) + (clip.offset || 0);
  return Math.min(local, Math.max(0, (clip.srcDur || 0) - 0.05));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cover(ctx, src, sw, sh, x, y, w, h, zoom = 1, pan = 0) {
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, x + (w - dw) / 2 + pan * (dw - w), y + (h - dh) / 2, dw, dh);
}

// A soft, dimmed copy of a picture for behind a collage. Shrinking and enlarging blurs it,
// which works in every browser (Safari's canvas has no blur filter).
function backdrop(clip) {
  if (clip.backdrop) return clip.backdrop;
  const first = clip.items[0];
  const small = document.createElement('canvas');
  small.width = 27;
  small.height = 48;
  cover(small.getContext('2d'), first.still, first.w, first.h, 0, 0, small.width, small.height);
  const c = document.createElement('canvas');
  c.width = W / 2;
  c.height = H / 2;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(small, 0, 0, c.width, c.height);
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(0, 0, c.width, c.height);
  clip.backdrop = c;
  return c;
}

// Where each picture of a collage goes (2–5 pictures), inside the upper-middle of the screen.
export function collageRects(n) {
  const x = 44;
  const y = 150;
  const w = W - 88;
  const h = 900;
  const gap = 12;
  const half = (w - gap) / 2;
  if (n <= 2) return [[x, y, w, (h - gap) / 2], [x, y + (h + gap) / 2, w, (h - gap) / 2]];
  if (n === 3) {
    const top = h * 0.56;
    return [[x, y, w, top], [x, y + top + gap, half, h - top - gap], [x + half + gap, y + top + gap, half, h - top - gap]];
  }
  if (n === 4) {
    const row = (h - gap) / 2;
    return [[x, y, half, row], [x + half + gap, y, half, row], [x, y + row + gap, half, row], [x + half + gap, y + row + gap, half, row]];
  }
  const top = h * 0.42;
  const row = (h - top - gap * 2) / 2;
  const y2 = y + top + gap;
  return [[x, y, w, top], [x, y2, half, row], [x + half + gap, y2, half, row], [x, y2 + row + gap, half, row], [x + half + gap, y2 + row + gap, half, row]];
}

function drawCollage(ctx, clip, local) {
  ctx.drawImage(backdrop(clip), 0, 0, W, H);
  collageRects(clip.items.length).forEach(([x, y, w, h], k) => {
    const item = clip.items[k];
    const a = easeOut((local - 0.05 - k * 0.12) / 0.4);
    if (a <= 0) return;
    const s = 0.94 + 0.06 * a;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(s, s);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 18;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.clip();
    cover(ctx, item.still, item.w, item.h, x, y, w, h, 1 + 0.04 * clamp01(local / 4));
    ctx.restore();
  });
}

// The finished collage as a still, for the clip list.
export function collagePoster(clip) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  drawCollage(c.getContext('2d'), clip, 9);
  return c;
}

function drawShot(ctx, seg, t, alpha) {
  const { clip } = seg;
  const local = t - seg.start;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (clip.kind === 'collage') {
    drawCollage(ctx, clip, local);
    ctx.restore();
    return;
  }
  const video = clip.kind === 'video' ? clip.el : null;
  const ready = video && video.readyState >= 2 && video.videoWidth;
  const src = ready ? video : clip.still;
  const sw = ready ? video.videoWidth : clip.w;
  const sh = ready ? video.videoHeight : clip.h;
  if (src && sw && sh) {
    // Photos drift slowly (alternating direction); videos only zoom a touch.
    const p = clamp01(local / (seg.end - seg.start + 0.5));
    const odd = (clip.index ?? 0) % 2;
    const zoom = video ? 1 + 0.03 * p : 1.04 + 0.1 * (odd ? 1 - p : p);
    const pan = video ? 0 : (odd ? -1 : 1) * (p - 0.5) * 0.5;
    cover(ctx, src, sw, sh, 0, 0, W, H, zoom, pan);
  }
  ctx.restore();
}

// Splits text into lines that fit, then evens them out so no word is left alone on the last
// line ("Made by hand, every / day" becomes "Made by hand, / every day").
function wrap(ctx, text, maxWidth, maxLines) {
  const lines = wrapAt(ctx, text, maxWidth, maxLines);
  if (lines.length < 2 || lines.length > maxLines) return lines;
  let lo = maxWidth / lines.length;
  let hi = maxWidth;
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2;
    if (wrapAt(ctx, text, mid, 99).length > lines.length) lo = mid;
    else hi = mid;
  }
  return wrapAt(ctx, text, hi, maxLines);
}

// Breaks between words, or between Japanese characters.
function wrapAt(ctx, text, maxWidth, maxLines) {
  const tokens = String(text).match(/[　-ヿ㐀-鿿豈-﫿＀-￯]|[^\s　-ヿ㐀-鿿豈-﫿＀-￯]+|\s+/g) || [];
  const lines = [];
  let line = '';
  for (const tok of tokens) {
    const next = line + tok;
    if (line.trim() && ctx.measureText(next.trim()).width > maxWidth) {
      lines.push(line.trim());
      line = tok.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

const setFont = (ctx, [size, weight], look) => {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${look.spacing}px`;
};

// White words with a soft shadow, centered on cy. rows: [{ text, font: [size, weight] }].
// `rise` lifts the block as it appears; `scale` is for the lively pop-in. Returns the block's box.
function words(ctx, rows, cy, look, alpha, { rise = 0, scale = 1 } = {}) {
  const laid = rows.filter((r) => r.text).map((r) => {
    setFont(ctx, r.font, look);
    const text = look.upper ? r.text.toUpperCase() : r.text;
    const lines = wrap(ctx, text, W - 120, 3);
    return { ...r, lines, lh: r.font[0] * 1.2 };
  });
  if (!laid.length || alpha <= 0) return null;
  const gap = 16;
  const height = laid.reduce((sum, r) => sum + r.lines.length * r.lh, 0) + gap * (laid.length - 1);
  let y = cy - height / 2 + rise;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, cy);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -cy);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = look.sparkle ? 14 : 20;
  ctx.shadowOffsetY = 2;
  for (const r of laid) {
    setFont(ctx, r.font, look);
    r.lines.forEach((l) => {
      ctx.fillText(l, W / 2, y + r.lh / 2);
      y += r.lh;
    });
    y += gap;
  }
  ctx.restore();
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  return { top: cy - height / 2, bottom: cy + height / 2 };
}

// A thin gold arc that draws itself around the words, with glitter along it (elegant look).
function sparkle(ctx, cy, p, t) {
  if (p <= 0) return;
  const rx = 300;
  const ry = 230;
  const tilt = -0.12;
  const from = Math.PI * 0.72;
  const sweep = Math.PI * 1.55 * p;
  ctx.save();
  ctx.globalAlpha = 0.85 * clamp01(p * 3);
  const grad = ctx.createLinearGradient(W / 2 - rx, 0, W / 2 + rx, 0);
  grad.addColorStop(0, 'rgba(245,211,138,0)');
  grad.addColorStop(0.5, '#f5d38a');
  grad.addColorStop(1, '#fff3cf');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(255,214,120,0.8)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(W / 2, cy, rx, ry, tilt, from, from + sweep);
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let k = 0; k < 70; k++) {
    const u = k / 70;
    if (u > p) break;
    const ang = from + Math.PI * 1.55 * u;
    const jitter = ((k * 37) % 17) - 8;
    const ex = Math.cos(ang) * (rx + jitter);
    const ey = Math.sin(ang) * (ry + jitter);
    const x = W / 2 + ex * Math.cos(tilt) - ey * Math.sin(tilt);
    const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
    const twinkle = 0.5 + 0.5 * Math.sin(t * 9 + k * 1.7);
    ctx.globalAlpha = 0.9 * twinkle * (u > p - 0.08 ? 1 : 0.7);
    ctx.fillStyle = k % 3 ? '#ffe7a8' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (k % 4) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A gentle dark band behind the middle of the screen so white words read on bright shots.
function band(ctx, cy, strength) {
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(0, cy - 320, 0, cy + 320);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, `rgba(0,0,0,${0.3 * strength})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, cy - 320, W, 640);
}

// project: { clips, name, jname, catch, outro, template, transition }
export function drawFrame(ctx, project, t) {
  const look = LOOKS[project.template] || LOOKS.simple;
  const { segments, fade } = timeline(project.clips, project.transition);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  if (!segments.length) return;

  let i = segments.findIndex((s) => t < s.end);
  if (i < 0) i = segments.length - 1;
  const seg = segments[i];
  const local = t - seg.start;
  const fading = i > 0 && fade > 0 && local < fade;
  if (fading) drawShot(ctx, segments[i - 1], t, 1);
  drawShot(ctx, seg, t, fading ? easeOut(local / fade) : 1);

  const title = (sub) => [{ text: project.name, font: look.title }, { text: sub, font: look.sub }];
  const isLast = i === segments.length - 1;

  // Opening: the shop name and one line, shown from the very first frame (that frame is what
  // the feed shows before the video plays), leaving as the first caption arrives.
  if (t < INTRO && (project.name || project.catch)) {
    const a = 1 - clamp01((t - (INTRO - 0.45)) / 0.45);
    const cy = H * TITLE_Y;
    band(ctx, cy, a);
    const box = words(ctx, title(project.catch), cy, look, a);
    if (look.sparkle) sparkle(ctx, cy, easeOut(t / 1.6) * a, t);
    if (look.vertical && project.jname && box) vertical(ctx, project.jname, box.bottom + 36, a * easeOut((t - 0.3) / 0.6));
    return;
  }

  // Closing: over the last shot, the shop name and the closing line.
  if (isLast && (project.name || project.outro)) {
    const start = Math.max(seg.start, INTRO - 0.2) + 0.15;
    const p = (t - start) / 0.5;
    if (p <= 0) return;
    const a = easeOut(p);
    const cy = H * TITLE_Y;
    band(ctx, cy, a);
    words(ctx, title(project.outro), cy, look, a, { rise: (1 - a) * 24, scale: look.pop ? 1 + 0.14 * (1 - easeOut((t - start) / 0.25)) : 1 });
    if (look.sparkle) sparkle(ctx, cy, easeOut((t - start) / 1.6), t);
    return;
  }

  // Captions: one block per run of shots sharing the same words.
  const text = seg.clip.caption?.trim();
  if (!text) return;
  const start = Math.max(seg.run.start, INTRO - 0.25) + (seg.run.start === 0 ? 0 : 0.12);
  const inP = (t - start) / (look.pop ? 0.25 : 0.45);
  if (inP <= 0) return;
  const out = fade > 0 ? 1 - clamp01((t - (seg.run.end - 0.3)) / 0.3) : (t < seg.run.end ? 1 : 0);
  const a = Math.min(easeOut(inP), out);
  const cy = H * CAPTION_Y;
  band(ctx, cy, a * 0.8);
  words(ctx, [{ text, font: fitSize(look.caption, text) }], cy, look, a, {
    rise: look.pop ? 0 : (1 - easeOut(inP)) * 20,
    scale: look.pop ? 1 + 0.15 * (1 - easeOut(inP)) : 1,
  });
}
