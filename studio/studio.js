// Video studio: a restaurant turns photos and clips from its phone into a short 9:16 video
// for the feed, then posts it to EatNow or saves it. The video is made in the browser
// (canvas + MediaRecorder); the server only receives the finished file, through the same
// upload the dashboard uses. Making and saving works without logging in; posting needs it.
// The same page also runs in the Mac/Windows app (desktop/): there the restaurant's details
// come from the app's settings, suggestions go through the app, and the video is saved to a file.

import { t, pick, escapeHtml, initI18n, onLangChange, errText, getLang } from './i18n.js';
import { api, ApiError } from './net.js';
import { ic, CUISINE_ART } from './ui.js';
import { W, H, LOOKS, TRANSITIONS, timeline, sourceTime, drawFrame, collagePoster } from './studio-render.js';
import { MUSIC, playMusic } from './studio-music.js';

const TOKEN_KEY = 'eatnow.owner';
const MAX_CLIPS = 10;
const MAX_TOTAL = 60; // seconds
const LONG_TOTAL = 30; // past this we suggest trimming
const STILL_MAX = 1440; // longest edge kept for photos
const LEN = { min: 1, max: 8, step: 0.5, photo: 2.5, video: 4, collage: 3.5 };
const COLLAGE_MAX = 5; // pictures in one collage
const FRAME_MAX = 512; // longest edge of the stills sent for word suggestions
// File size limits the owner can pick (MB, counted as 1,000,000 bytes, which is also under the
// same number in MiB); 0 is no limit. Some places a short video goes cap it around 15MB.
const SIZES = [0, 30, 15, 10, 5];
const SIZE_KEY = 'eatnow.studio.maxMB';
const RATE = { video: 6_000_000, audio: 128_000, smallAudio: 64_000, minVideo: 300_000 };
// Most people watching the feed are visiting from abroad, so the closing line starts in English.
const DEFAULT_OUTRO = "We can't wait to see you!";


// The studio's words are the "st." keys in i18n.js.
const s = (key, vars) => t(`st.${key}`, vars);
const es = (key, vars) => escapeHtml(s(key, vars));


// Set by the Mac/Windows app (desktop/preload.js) or the studio with no server
// (studio-static/bridge.js); undefined on the web.
const desktop = window.eatnowDesktop;
// The app saves the video to a file the owner picks; elsewhere the browser downloads it.
const savesToFile = Boolean(desktop?.saveVideo);

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx2d = canvas.getContext('2d');

const state = {
  token: null,
  restaurant: null,
  ai: false, // whether suggestions look at the shots (the server has a Claude API key)
  sugg: null, // word suggestions: { busy, again, round, source, fallback, error, catch, outro, captions: { clipId: options }, seen, before }
  clips: [],
  name: '',
  jname: '', // the Japanese name, written vertically in the elegant look
  catch: '',
  outro: DEFAULT_OUTRO,
  template: 'simple',
  transition: LOOKS.simple.transition,
  music: 'none', // most videos need none; the owner can add one
  t: 0,
  playing: false,
  overlay: false,
  rec: null, // while recording: { recorder, chunks, stopped, stream, hold, total }
  result: null, // { blob, url, ext, seconds }
  posting: false,
  posted: false,
  saved: null, // in the desktop app: where the made video was saved
  maxMB: 0, // file size limit (SIZES)
  squeeze: 1, // lowered when a video came out over the limit, so the next try fits
  notice: null, // { kind: 'error' | 'info', text }
  loadErrors: [],
  busy: 0, // files still being opened
};
try { state.token = localStorage.getItem(TOKEN_KEY); } catch {}
try { state.maxMB = SIZES.includes(Number(localStorage.getItem(SIZE_KEY))) ? Number(localStorage.getItem(SIZE_KEY)) : 0; } catch {}

let nextId = 1;
const project = () => ({
  clips: state.clips, name: state.name.trim(), jname: state.jname.trim(), catch: state.catch.trim(), outro: state.outro.trim(),
  template: state.template, transition: state.transition,
});
const fmtTime = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const fmtSec = (sec) => `${(Math.round(sec * 10) / 10).toFixed(1)}s`;
const tl = () => timeline(state.clips, state.transition);
const total = () => tl().total;

// ---------- Opening photos and clips ----------

function shrink(src, w, h) {
  const scale = Math.min(1, STILL_MAX / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function thumbOf(src, w, h) {
  const c = document.createElement('canvas');
  c.width = 108;
  c.height = 192;
  const scale = Math.max(c.width / w, c.height / h);
  c.getContext('2d').drawImage(src, (c.width - w * scale) / 2, (c.height - h * scale) / 2, w * scale, h * scale);
  return c.toDataURL('image/jpeg', 0.75);
}

function waitFor(el, ok, ms = 8000) {
  return new Promise((resolve, reject) => {
    const done = (fn) => () => { clearTimeout(timer); el.removeEventListener(ok, onOk); el.removeEventListener('error', onErr); fn(); };
    const onOk = done(resolve);
    const onErr = done(() => reject(new Error('media')));
    const timer = setTimeout(onErr, ms);
    el.addEventListener(ok, onOk);
    el.addEventListener('error', onErr);
  });
}

function seek(el, time) {
  if (Math.abs(el.currentTime - time) < 0.01 && el.readyState >= 2) return Promise.resolve();
  const p = waitFor(el, 'seeked', 4000).catch(() => {});
  el.currentTime = time;
  return p;
}

async function photoClip(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const still = shrink(img, img.naturalWidth, img.naturalHeight);
    return { kind: 'image', still, w: still.width, h: still.height, thumb: thumbOf(still, still.width, still.height), dur: LEN.photo };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoClip(file) {
  const el = document.createElement('video');
  el.muted = true;
  el.playsInline = true;
  el.preload = 'auto';
  el.setAttribute('playsinline', '');
  el.src = URL.createObjectURL(file);
  $('pool').append(el); // iOS only decodes frames for videos that are in the page
  try {
    await waitFor(el, 'loadedmetadata');
    if (!el.videoWidth || !Number.isFinite(el.duration)) throw new Error('media');
    await seek(el, Math.min(0.3, el.duration / 3));
    const still = shrink(el, el.videoWidth, el.videoHeight);
    const srcDur = el.duration;
    el.addEventListener('seeked', () => { if (!state.playing) requestDraw(); });
    return {
      kind: 'video', el, srcDur, offset: 0, still, w: still.width, h: still.height,
      thumb: thumbOf(still, still.width, still.height),
      dur: Math.max(Math.min(1, srcDur), Math.min(LEN.video, Math.floor(srcDur * 2) / 2)),
    };
  } catch (err) {
    URL.revokeObjectURL(el.src);
    el.remove();
    throw err;
  }
}

async function addFiles(files) {
  const room = MAX_CLIPS - state.clips.length;
  const list = [...files].filter((f) => /^(image|video)\//.test(f.type));
  state.loadErrors = [];
  if (list.length > room) state.loadErrors.push(s('max', { n: MAX_CLIPS }));
  const picked = list.slice(0, Math.max(0, room));
  state.busy += picked.length;
  renderClips();
  for (const file of picked) {
    try {
      const clip = await (file.type.startsWith('video/') ? videoClip(file) : photoClip(file));
      state.clips.push({ id: nextId++, caption: '', ...clip });
    } catch {
      state.loadErrors.push(s('bad', { name: file.name }));
    }
    state.busy -= 1;
    clipsChanged();
  }
}

// Illustrated shots so the studio can be tried without any photos to hand, laid out like the
// restaurant videos EatNow has: an opening shot, captions, a collage of dishes, a closing shot.
// The pictures are drawn here, not emoji: an emoji is the OS maker's artwork, and a sample
// someone exports and posts would carry it.
const ART = {
  // Two pieces of nigiri (salmon and tuna) on a round plate.
  nigiri(g, x, y) {
    shadow(g, x, y + 92, 250, 40);
    ellipse(g, x, y + 70, 240, 76, '#fbfaf7', '#e2dacd', 6);
    ellipse(g, x, y + 66, 196, 54, '#f2ede4');
    for (const [dx, fish, stripes] of [[-100, '#c9374a', false], [100, '#f08a5d', true]]) {
      round(g, x + dx - 82, y - 6, 164, 84, 42, '#fffdf8', '#e6ddcf', 3);
      round(g, x + dx - 94, y - 52, 188, 66, 32, fish);
      g.save();
      g.globalAlpha = 0.5;
      g.strokeStyle = '#ffffff';
      g.lineWidth = stripes ? 7 : 5;
      g.lineCap = 'round';
      for (const k of stripes ? [-50, -10, 30] : [-30]) line(g, x + dx + k, y - 44, x + dx + k + 26, y + 6);
      g.restore();
    }
  },
  // A whole fish, for "fresh from the market".
  fish(g, x, y) {
    shadow(g, x, y + 150, 230, 30);
    g.beginPath();
    g.moveTo(x - 220, y);
    g.bezierCurveTo(x - 140, y - 130, x + 90, y - 120, x + 150, y);
    g.bezierCurveTo(x + 90, y + 120, x - 140, y + 130, x - 220, y);
    const body = g.createLinearGradient(0, y - 120, 0, y + 120);
    body.addColorStop(0, '#3f6fb8');
    body.addColorStop(0.55, '#7ea6e3');
    body.addColorStop(1, '#e6eefb');
    g.fillStyle = body;
    g.fill();
    poly(g, [[x + 130, y], [x + 230, y - 90], [x + 205, y], [x + 230, y + 90]], '#3f6fb8');
    poly(g, [[x - 40, y - 96], [x + 30, y - 150], [x + 60, y - 92]], '#5a86cc');
    g.save();
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    g.lineWidth = 4;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x - 40 + k * 44, y - 4, 34, -0.9, 0.9); g.stroke(); }
    g.restore();
    circle(g, x - 150, y - 22, 20, '#ffffff');
    circle(g, x - 146, y - 22, 10, '#1c2433');
  },
  // Two prawn tempura with a lemon wedge.
  tempura(g, x, y) {
    shadow(g, x, y + 120, 230, 36);
    ellipse(g, x, y + 90, 220, 70, '#fbfaf7', '#e2dacd', 6);
    for (const dy of [-30, 40]) {
      g.save();
      g.lineCap = 'round';
      g.strokeStyle = '#d99a34';
      g.lineWidth = 78;
      g.beginPath();
      g.moveTo(x - 150, y + dy + 20);
      g.quadraticCurveTo(x - 10, y + dy - 50, x + 130, y + dy);
      g.stroke();
      g.restore();
      for (let k = 0; k < 9; k++) circle(g, x - 140 + k * 32, y + dy - 22 + Math.sin(k * 1.7) * 10 + (k < 4 ? 18 - k * 6 : -6 + k * 2), 11, '#f1c26a');
      poly(g, [[x + 150, y + dy], [x + 215, y + dy - 44], [x + 200, y + dy], [x + 215, y + dy + 44]], '#e2553b');
    }
    poly(g, [[x - 210, y + 60], [x - 120, y + 100], [x - 190, y + 140]], '#f4d64e');
  },
  // A lacquered box with rice, salmon, greens and rolled omelette.
  bento(g, x, y) {
    shadow(g, x, y + 190, 250, 34);
    round(g, x - 230, y - 170, 460, 340, 28, '#2a2422');
    round(g, x - 210, y - 150, 420, 300, 18, '#b8332b');
    const cell = (cx, cy, w, h, fill) => round(g, cx, cy, w, h, 12, fill);
    cell(x - 196, y - 136, 196, 272, '#fffdf8');
    circle(g, x - 98, y, 22, '#c93a4a');
    cell(x + 12, y - 136, 184, 128, '#f08a5d');
    g.save();
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 6;
    for (const k of [40, 90, 140]) line(g, x + 12 + k, y - 126, x + k - 14, y - 18);
    g.restore();
    cell(x + 12, y + 8, 184, 128, '#7fb069');
    for (const [dx, dy] of [[50, 40], [110, 60], [150, 100], [70, 100]]) circle(g, x + 12 + dx, y + 8 + dy, 26, '#4f8a3c');
    round(g, x - 180, y + 70, 70, 50, 10, '#f6d04d');
  },
  // Two pieces of rolled-omelette nigiri, each tied with a band of nori.
  tamago(g, x, y) {
    shadow(g, x, y + 110, 240, 36);
    round(g, x - 240, y + 40, 480, 70, 20, '#3a2a22');
    for (const dx of [-110, 110]) {
      round(g, x + dx - 86, y - 10, 172, 80, 40, '#fffdf8', '#e6ddcf', 3);
      round(g, x + dx - 96, y - 70, 192, 80, 16, '#f6d04d');
      round(g, x + dx - 96, y - 70, 192, 18, 9, '#e9b93a');
      g.fillStyle = '#1f2a24';
      g.fillRect(x + dx - 22, y - 74, 44, 124);
    }
  },
  // A sake flask and a cup with the blue bull's-eye ring.
  sake(g, x, y) {
    shadow(g, x, y + 190, 230, 30);
    const bx = x - 70;
    g.beginPath();
    g.moveTo(bx - 34, y - 200);
    g.lineTo(bx + 34, y - 200);
    g.bezierCurveTo(bx + 30, y - 120, bx + 140, y - 20, bx + 120, y + 100);
    g.bezierCurveTo(bx + 110, y + 190, bx - 110, y + 190, bx - 120, y + 100);
    g.bezierCurveTo(bx - 140, y - 20, bx - 30, y - 120, bx - 34, y - 200);
    g.fillStyle = '#f4f1ea';
    g.fill();
    g.strokeStyle = '#d8d1c3';
    g.lineWidth = 4;
    g.stroke();
    round(g, bx - 128, y + 20, 256, 34, 17, '#3a6fcf');
    ellipse(g, bx, y - 200, 36, 10, '#e6dfd2');
    const cx = x + 140;
    g.beginPath();
    g.moveTo(cx - 80, y + 60);
    g.lineTo(cx + 80, y + 60);
    g.lineTo(cx + 54, y + 170);
    g.lineTo(cx - 54, y + 170);
    g.closePath();
    g.fillStyle = '#f4f1ea';
    g.fill();
    ellipse(g, cx, y + 60, 80, 24, '#ffffff', '#d8d1c3', 4);
    ellipse(g, cx, y + 62, 56, 15, 'rgba(58,111,207,0)', '#3a6fcf', 7);
  },
  // Chopsticks on a rest, with a small dish of soy sauce.
  chopsticks(g, x, y) {
    shadow(g, x, y + 120, 240, 30);
    ellipse(g, x + 120, y + 70, 110, 40, '#fbfaf7', '#e2dacd', 5);
    ellipse(g, x + 120, y + 68, 76, 24, '#4a2a1c');
    round(g, x - 160, y - 10, 90, 44, 22, '#d9822b');
    for (const dy of [-20, 16]) {
      g.save();
      g.translate(x, y + dy);
      g.rotate(-0.22);
      const wood = g.createLinearGradient(-260, 0, 220, 0);
      wood.addColorStop(0, '#6b4129');
      wood.addColorStop(0.75, '#a8744e');
      wood.addColorStop(1, '#e3c39d');
      g.fillStyle = wood;
      g.beginPath();
      g.moveTo(-260, -9);
      g.lineTo(220, -4);
      g.lineTo(220, 4);
      g.lineTo(-260, 9);
      g.closePath();
      g.fill();
      g.restore();
    }
  },
  // A red paper lantern with a warm glow, for the closing shot.
  lantern(g, x, y) {
    const glow = g.createRadialGradient(x, y, 40, x, y, 330);
    glow.addColorStop(0, 'rgba(255,214,140,0.55)');
    glow.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = glow;
    g.fillRect(x - 340, y - 340, 680, 680);
    g.strokeStyle = '#2a2422';
    g.lineWidth = 6;
    line(g, x, y - 340, x, y - 230);
    ellipse(g, x, y, 160, 215, '#d9452b');
    g.save();
    g.beginPath();
    g.ellipse(x, y, 160, 215, 0, 0, Math.PI * 2);
    g.clip();
    g.strokeStyle = 'rgba(120,30,20,0.45)';
    g.lineWidth = 5;
    for (let k = -4; k <= 4; k++) { g.beginPath(); g.ellipse(x, y + k * 46, 170, 26, 0, 0, Math.PI); g.stroke(); }
    ellipse(g, x - 60, y - 60, 40, 110, 'rgba(255,255,255,0.18)');
    g.restore();
    round(g, x - 90, y - 238, 180, 34, 8, '#2a2422');
    round(g, x - 90, y + 204, 180, 34, 8, '#2a2422');
    g.fillStyle = '#d9a13a';
    g.fillRect(x - 6, y + 238, 12, 60);
  },
};

function ellipse(g, x, y, rx, ry, fill, stroke, width) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
const circle = (g, x, y, r, fill) => ellipse(g, x, y, r, r, fill);
const shadow = (g, x, y, rx, ry) => ellipse(g, x, y, rx, ry, 'rgba(40,20,10,0.16)');
function round(g, x, y, w, h, r, fill, stroke, width) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
function poly(g, pts, fill) {
  g.beginPath();
  pts.forEach(([px, py], k) => (k ? g.lineTo(px, py) : g.moveTo(px, py)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}
function line(g, x1, y1, x2, y2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function artCard(name, light, deep, i) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W * (i % 2 ? 1 : 0.3), H);
  grad.addColorStop(0, light);
  grad.addColorStop(1, deep);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.14)';
  for (let k = 0; k < 18; k++) {
    g.beginPath();
    g.arc((k * 173 + i * 61) % W, (k * 311 + i * 97) % H, 18 + (k % 4) * 14, 0, Math.PI * 2);
    g.fill();
  }
  g.translate(W / 2, H * 0.58);
  g.scale(1.25, 1.25);
  ART[name](g, 0, 0);
  return { still: c, w: W, h: H };
}

// The captions (Toyosu fish, sake, counter seats) are a sushi bar's, so the pictures are too.
function sampleClips() {
  const shot = (art, caption, dur = LEN.photo) => ({ id: nextId++, kind: 'image', ...art, thumb: thumbOf(art.still, W, H), dur, caption });
  const collage = makeCollage([artCard('tempura', '#fde3c8', '#d9822b', 4), artCard('bento', '#e2ecfb', '#3a6fcf', 5), artCard('tamago', '#fff3c4', '#d4a017', 6)], s('sample1'));
  return [
    shot(artCard('nigiri', '#fbd3dd', '#e0567a', 0), ''),
    shot(artCard('fish', '#d6e4fa', '#3a6fcf', 1), s('sample2')),
    collage,
    shot(artCard('sake', '#d9f0e0', '#2b8a57', 2), s('sample3')),
    shot(artCard('chopsticks', '#efe2d6', '#8a5a3c', 3), s('sample4')),
    shot(artCard('lantern', '#f8e6c6', '#c27a1a', 7), '', 3),
  ];
}

// ---------- Collages: several photos on one screen ----------

const itemsOf = (c) => (c.kind === 'collage' ? c.items : [{ still: c.still, w: c.w, h: c.h }]);
const canMerge = (a, b) => a && b && a.kind !== 'video' && b.kind !== 'video' && itemsOf(a).length + itemsOf(b).length <= COLLAGE_MAX;

function makeCollage(items, caption = '', id = nextId++) {
  const clip = { id, kind: 'collage', items, caption, dur: LEN.collage };
  const poster = collagePoster(clip);
  return { ...clip, thumb: thumbOf(poster, W, H) };
}

function mergeWithNext(i) {
  const [a, b] = [state.clips[i], state.clips[i + 1]];
  if (!canMerge(a, b)) return;
  const merged = makeCollage([...itemsOf(a), ...itemsOf(b)], a.caption || b.caption, a.id);
  merged.dur = Math.max(LEN.collage, a.dur);
  state.clips.splice(i, 2, merged);
}

function splitCollage(i) {
  const c = state.clips[i];
  const shots = c.items.map((it, k) => ({
    id: k ? nextId++ : c.id, kind: 'image', ...it, thumb: thumbOf(it.still, it.w, it.h), dur: LEN.photo, caption: k ? '' : c.caption,
  }));
  state.clips.splice(i, 1, ...shots);
}

function removeClip(clip) {
  if (clip.el) {
    clip.el.pause();
    URL.revokeObjectURL(clip.el.src);
    clip.el.remove();
  }
  state.clips = state.clips.filter((c) => c !== clip);
}

// Anything that changes the timeline: renumber, keep the playhead in range, redraw.
function clipsChanged() {
  state.clips.forEach((c, i) => { c.index = i; });
  if (state.playing) stopPlayback();
  state.t = Math.min(state.t, Math.max(0, total() - 0.01));
  clearResult();
  renderClips();
  renderText();
  renderExport();
  updatePlayButton(); // playable once there is a clip
  requestDraw();
}

// ---------- Drag and drop ----------

// Files dropped anywhere on the page are added like picked ones, several at a time. Without
// this, the browser (or the app) would open the dropped file in place of the studio.
const canDrop = !matchMedia('(pointer: coarse)').matches; // phones don't drag files in
const hasFiles = (ev) => [...(ev.dataTransfer?.types || [])].includes('Files');
let dragDepth = 0;

function dropZone(on) {
  let zone = $('dropzone');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'dropzone';
    zone.className = 'dropzone';
    document.body.append(zone);
  }
  zone.innerHTML = `${ic('plus', 'ic--lg')}<span>${es('dropHere')}</span>`;
  zone.hidden = !on;
}

document.addEventListener('dragenter', (ev) => {
  if (!hasFiles(ev)) return;
  ev.preventDefault();
  if (dragDepth++ === 0 && !state.rec) dropZone(true);
});
document.addEventListener('dragover', (ev) => {
  if (!hasFiles(ev)) return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = state.rec ? 'none' : 'copy';
});
document.addEventListener('dragleave', (ev) => {
  if (!hasFiles(ev)) return;
  if (--dragDepth <= 0) {
    dragDepth = 0;
    dropZone(false);
  }
});
document.addEventListener('drop', (ev) => {
  if (!hasFiles(ev)) return;
  ev.preventDefault();
  dragDepth = 0;
  dropZone(false);
  if (state.rec) return;
  addFiles(ev.dataTransfer.files);
  $('s-clips').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ---------- Preview and playback ----------

let actx = null;
let playing = null; // { zeroAt, stopMusic, total }
let drawQueued = false;

function audio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state !== 'running') actx.resume().catch(() => {}); // called inside the tap, as iOS requires
  return actx;
}

const clock = () => (playing ? actx.currentTime - playing.zeroAt : state.t);

// Keeps each video at the right moment: playing while its clip is on screen (and through the
// next fade), parked on its first frame just before, paused otherwise.
function syncVideos(t, live) {
  const { segments, fade } = tl();
  for (const seg of segments) {
    const { clip } = seg;
    if (clip.kind !== 'video') continue;
    const el = clip.el;
    if (t < seg.start - 0.8 || t >= seg.end + fade) {
      if (!el.paused) el.pause();
      continue;
    }
    const want = sourceTime(seg, t);
    if (live && t >= seg.start && want < clip.srcDur - 0.06) {
      if (el.paused) {
        el.currentTime = want;
        el.play().catch(() => {});
      } else if (Math.abs(el.currentTime - want) > 0.3) {
        el.currentTime = want;
      }
    } else {
      if (!el.paused) el.pause();
      if (!el.seeking && Math.abs(el.currentTime - want) > 0.04) el.currentTime = want;
    }
  }
}

function pauseVideos() {
  for (const c of state.clips) if (c.el && !c.el.paused) c.el.pause();
}

function draw() {
  drawFrame(ctx2d, project(), state.t);
}

function requestDraw() {
  if (drawQueued || state.playing) return;
  drawQueued = true;
  requestAnimationFrame(() => {
    drawQueued = false;
    if (state.playing) return;
    syncVideos(state.t, false);
    draw();
    updateClock();
  });
}

function startPlayback(record = null) {
  const ctx = audio();
  const len = total();
  if (!len) return;
  if (state.t >= len - 0.05) state.t = 0;
  const startAt = ctx.currentTime + 0.1;
  const zeroAt = startAt - state.t;
  const outputs = [ctx.destination, ...(record ? [record] : [])];
  const stopMusic = state.music === 'none' ? () => {} : playMusic(ctx, state.music, len, state.t, zeroAt, outputs);
  playing = { zeroAt, stopMusic, total: len };
  state.playing = true;
  updatePlayButton();
  requestAnimationFrame(tick);
}

function stopPlayback() {
  if (!playing) return;
  state.t = Math.max(0, Math.min(clock(), playing.total));
  playing.stopMusic();
  playing = null;
  state.playing = false;
  pauseVideos();
  updatePlayButton();
}

function tick() {
  if (!state.playing) return;
  const t = clock();
  if (t >= playing.total) {
    state.t = playing.total;
    draw();
    stopPlayback();
    if (state.rec) finishRecording(false);
    else {
      state.t = 0;
      requestDraw();
    }
    return;
  }
  state.t = Math.max(0, t);
  syncVideos(state.t, true);
  draw();
  updateClock();
  requestAnimationFrame(tick);
}

function updateClock() {
  const len = total();
  $('time').textContent = `${fmtTime(state.t)} / ${fmtTime(len)}`;
  const scrub = $('scrub');
  scrub.max = String(len || 0);
  scrub.value = String(state.t);
  scrub.disabled = !len || Boolean(state.rec);
  const now = tl().segments.findIndex((seg) => state.t < seg.end);
  document.querySelectorAll('.clip').forEach((li, i) => li.classList.toggle('is-now', i === now));
  if (state.rec) {
    const p = Math.round((100 * state.t) / state.rec.total);
    const bar = $('recbar');
    if (bar) bar.style.width = `${p}%`;
    const label = $('reclabel');
    if (label) label.textContent = s('rec', { p });
  }
}

function updatePlayButton() {
  const b = $('play');
  b.innerHTML = ic(state.playing ? 'pause' : 'play');
  b.setAttribute('aria-label', s(state.playing ? 'pause' : 'play'));
  b.disabled = !state.clips.length || Boolean(state.rec);
}

function renderOverlay() {
  const r = state.restaurant;
  const cuisine = r?.cuisine && CUISINE_ART[r.cuisine]?.[0];
  $('app-overlay').hidden = !state.overlay;
  $('app-overlay').innerHTML = `
    <span class="pill pill--ok">${ic('check')}${es('seats')}</span>
    <strong class="stage__name">${escapeHtml(state.name.trim() || (r ? pick(r.name) : 'EatNow'))}</strong>
    <span class="stage__meta">${cuisine ? `${cuisine} · ` : ''}${ic('walk')}${es('walk')}</span>`;
}

// ---------- Recording ----------

const canRecord = () => typeof MediaRecorder !== 'undefined' && typeof canvas.captureStream === 'function';

function pickType() {
  const types = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

// Bit rates for a video of `len` seconds: the usual quality, or within the size limit. Leaves 10%
// for the file's own overhead and the encoder running over, times `squeeze` after a miss.
function rates(len) {
  if (!state.maxMB) return { video: RATE.video, audio: RATE.audio };
  const budget = ((state.maxMB * 1e6 * 8) / Math.max(len, 1)) * 0.9 * state.squeeze;
  return { video: Math.round(Math.max(RATE.minVideo, Math.min(RATE.video, budget - RATE.smallAudio))), audio: RATE.smallAudio };
}

const estMB = (len) => {
  const r = rates(len);
  return ((r.video + r.audio) * len) / 8 / 1e6;
};

async function startRecording() {
  if (!state.clips.length || state.rec) return;
  if (!canRecord()) {
    state.notice = { kind: 'error', text: s('unsupported') };
    return renderExport();
  }
  const ctx = audio();
  stopPlayback();
  clearResult();
  state.notice = null;
  state.t = 0;
  const len = total();
  state.rec = { total: len, starting: true };
  renderExport();
  updatePlayButton();
  // Park every video on its first frame so the recording doesn't open on a blank clip.
  await Promise.all(tl().segments
    .filter((seg) => seg.clip.kind === 'video')
    .map((seg) => seek(seg.clip.el, sourceTime(seg, seg.start))));
  if (!state.rec) return; // stopped while getting ready
  draw();

  const dest = ctx.createMediaStreamDestination();
  // Keep a (silent) signal on the sound track. With nothing playing into it, as with no music,
  // Chromium's recorder stalls and the file ends after about 1.6 seconds.
  const hold = ctx.createConstantSource();
  hold.offset.value = 0;
  hold.connect(dest);
  hold.start();
  const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mimeType = pickType();
  let recorder;
  try {
    const r = rates(len);
    recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: r.video, audioBitsPerSecond: r.audio });
  } catch {
    stream.getTracks().forEach((tr) => tr.stop());
    hold.stop();
    state.rec = null;
    state.notice = { kind: 'error', text: s('unsupported') };
    renderExport();
    updatePlayButton();
    return;
  }
  const chunks = [];
  recorder.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
  const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
  state.rec = { recorder, chunks, stopped, stream, hold, total: len };
  recorder.start(1000);
  startPlayback(dest);
}

async function finishRecording(cancelled) {
  const rec = state.rec;
  if (!rec) return;
  state.rec = null;
  stopPlayback();
  if (rec.recorder) {
    if (rec.recorder.state !== 'inactive') rec.recorder.stop();
    await rec.stopped;
    rec.stream.getTracks().forEach((tr) => tr.stop());
    rec.hold.stop();
  }
  state.t = 0;
  if (!cancelled && rec.chunks?.length) {
    const type = (rec.recorder.mimeType || rec.chunks[0].type || 'video/webm').split(';')[0];
    const blob = new Blob(rec.chunks, { type });
    state.result = { blob, url: URL.createObjectURL(blob), ext: type === 'video/mp4' ? 'mp4' : 'webm', seconds: rec.total };
    const limit = state.maxMB * 1e6;
    if (limit && blob.size > limit) {
      state.squeeze = Math.max(0.3, state.squeeze * (limit / blob.size) * 0.95);
      state.notice = { kind: 'error', text: s('sizeOver', { n: state.maxMB }) };
    }
  }
  renderExport();
  updatePlayButton();
  requestDraw();
  if (state.result) $('s-export').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearResult() {
  if (state.result) URL.revokeObjectURL(state.result.url);
  state.result = null;
  state.posted = false;
  state.saved = null;
}

// Recording runs in real time and stops drawing when the page is hidden, so start over.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.rec) {
    state.notice = { kind: 'error', text: s('hidden') };
    finishRecording(true);
  } else if (document.hidden) {
    stopPlayback();
  }
});

async function post() {
  if (!state.result || !state.token || state.posting) return;
  state.posting = true;
  state.notice = null;
  renderExport();
  try {
    const { blob, ext } = state.result;
    const file = new File([blob], `eatnow-video.${ext}`, { type: blob.type });
    const data = await api('/api/owner/media/video', { method: 'POST', file, headers: { Authorization: `Bearer ${state.token}` } });
    state.restaurant = data.restaurant;
    state.posted = true;
  } catch (err) {
    state.notice = { kind: 'error', text: errText(err.code) };
    if (err.status === 401) {
      state.token = null;
      state.restaurant = null;
      renderWho();
    }
  }
  state.posting = false;
  renderExport();
}

// The desktop app saves the video to a file the owner picks.
async function saveFile() {
  if (!state.result || state.posting) return;
  state.posting = true;
  state.notice = null;
  renderExport();
  try {
    const { blob, ext } = state.result;
    const { path, canceled } = await viaDesktop(desktop.saveVideo(await blob.arrayBuffer(), fileName(ext)));
    if (!canceled) state.saved = path;
  } catch (err) {
    state.notice = { kind: 'error', text: errText(err.code) };
  }
  state.posting = false;
  renderExport();
}

// The desktop app answers with { error: code } instead of throwing across the bridge.
async function viaDesktop(call) {
  const data = await call;
  if (data?.error) throw new ApiError(data.error, 0);
  return data;
}

// ---------- Word suggestions ----------

function jpeg(src, w, h) {
  const k = Math.min(1, FRAME_MAX / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7).split(',')[1];
}

// A still or two from each shot: what the words should fit.
async function shotStills() {
  const shots = [];
  for (const c of state.clips) {
    let images;
    if (c.kind === 'video') {
      images = [];
      for (const at of [0.25, 0.75]) {
        await seek(c.el, c.offset + c.dur * at);
        images.push(jpeg(c.el, c.el.videoWidth, c.el.videoHeight));
      }
    } else {
      images = itemsOf(c).slice(0, 3).map((it) => jpeg(it.still, it.w, it.h));
    }
    shots.push({ kind: c.kind, seconds: c.dur, images });
  }
  return shots;
}

const textsNow = () => ({ catch: state.catch, outro: state.outro, captions: Object.fromEntries(state.clips.map((c) => [c.id, c.caption])) });

async function suggest() {
  if (!state.restaurant || !state.clips.length || state.sugg?.busy || state.sugg?.again) return;
  if (state.playing) stopPlayback();
  const prev = state.sugg;
  state.sugg = { ...prev, busy: true, error: null, round: prev ? prev.round + 1 : 0, before: prev?.before || textsNow() };
  renderText();
  const ids = state.clips.map((c) => c.id);
  try {
    const shots = await shotStills();
    requestDraw();
    const body = { shots, look: state.template, noteLang: getLang(), round: state.sugg.round };
    const data = desktop
      ? await viaDesktop(desktop.suggest(body))
      : await api('/api/owner/studio/suggest', { method: 'POST', headers: { Authorization: `Bearer ${state.token}` }, body });
    const captions = {};
    data.captions.forEach((list, i) => { if (ids[i] != null) captions[ids[i]] = list; });
    Object.assign(state.sugg, { source: data.source, fallback: Boolean(data.fallback), catch: data.catch, outro: data.outro, captions });
    // The first candidate of each goes straight in; the others stay a tap away.
    if (data.catch[0]) state.catch = data.catch[0].text;
    if (data.outro[0]) state.outro = data.outro[0].text;
    for (const c of state.clips) if (captions[c.id]?.[0]) c.caption = captions[c.id][0].text;
    state.sugg.seen = {};
    seen('catch', data.catch);
    seen('outro', data.outro);
    for (const id of Object.keys(captions)) seen(`c${id}`, captions[id]);
  } catch (err) {
    state.sugg.error = errText(err.code);
    if (err.status === 401) {
      state.token = null;
      state.restaurant = null;
      renderWho();
    }
  }
  state.sugg.busy = false;
  clipsChanged();
  renderOverlay();
}

// What the owner has been shown for a field ('catch', 'outro' or 'c' + clip id), so "other ideas" differ.
function seen(key, list) {
  const g = state.sugg;
  g.seen = g.seen || {};
  g.seen[key] = [...new Set([...(g.seen[key] || []), ...(list || []).map((o) => o.text)])];
}

// Other ideas for one field: the catchphrase, the closing line or one clip's caption.
async function suggestAgain(field, clip) {
  const g = state.sugg;
  if (!g || g.busy || g.again || !state.clips.length) return;
  if (state.playing) stopPlayback();
  const key = field === 'caption' ? `c${clip.id}` : field;
  const index = clip ? state.clips.indexOf(clip) : 0;
  Object.assign(g, { again: key, error: null, round: g.round + 1 });
  field === 'caption' ? renderClips() : renderText();
  try {
    const shots = await shotStills();
    requestDraw();
    // Steer clear of what was shown for this field and of the other clips' captions.
    const others = field === 'caption' ? state.clips.filter((c) => c !== clip).map((c) => c.caption.trim()).filter(Boolean) : [];
    const body = { shots, look: state.template, noteLang: getLang(), round: g.round, again: { field, shot: index, avoid: [...new Set([...(g.seen?.[key] || []), ...others])] } };
    const data = desktop
      ? await viaDesktop(desktop.suggest(body))
      : await api('/api/owner/studio/suggest', { method: 'POST', headers: { Authorization: `Bearer ${state.token}` }, body });
    const list = field === 'caption' ? data.captions[index] : data[field];
    if (list?.length && state.sugg === g) {
      seen(key, list);
      if (field === 'caption') {
        g.captions[clip.id] = list;
        clip.caption = list[0].text;
      } else {
        g[field] = list;
        state[field] = list[0].text;
      }
    }
  } catch (err) {
    g.error = errText(err.code);
  }
  g.again = null;
  clipsChanged();
  renderOverlay();
}

function undoSuggest() {
  const before = state.sugg?.before;
  if (!before) return;
  state.catch = before.catch;
  state.outro = before.outro;
  for (const c of state.clips) if (c.id in before.captions) c.caption = before.captions[c.id];
  state.sugg = null;
  clipsChanged();
  renderOverlay();
}

// Candidates under a field. Each shows its meaning in the owner's language when that isn't English.
// `key` names the field for "other ideas" ('catch', 'outro' or 'c' + clip id).
function picksHtml(field, list, current, key = field) {
  const g = state.sugg;
  if (!list?.length || g?.busy) return '';
  const mine = g.again === key;
  return `<div class="picks" role="group" aria-label="${es('options')}">${list.map((o, i) => `
    <button type="button" class="pick" data-act="pick" data-pick="${field}" data-i="${i}" aria-pressed="${o.text === current.trim()}" ${mine ? 'disabled' : ''}>
      <span class="pick__text">${escapeHtml(o.text)}</span>${o.note ? `<span class="pick__note">${escapeHtml(o.note)}</span>` : ''}</button>`).join('')}
    <button type="button" class="link-btn pick-again" data-act="again-words" data-field="${field}" ${g.again ? 'disabled' : ''}>
      ${mine ? `<span class="spin" aria-hidden="true"></span>${es('suggesting')}` : `${ic('refresh')}${es('otherIdeas')}`}</button>
  </div>`;
}

function syncPicks(root, field, value) {
  root?.querySelectorAll(`[data-pick="${field}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.querySelector('.pick__text').textContent === value.trim()));
  });
}

function suggestHtml() {
  if (!state.restaurant) return `<p class="hint">${ic('sparkle')}${es(desktop ? 'suggestSetup' : 'suggestLogin')}</p>`;
  const g = state.sugg;
  const label = g?.busy ? (state.ai === 'local' ? 'suggestingLocal' : state.ai ? 'suggestingAi' : 'suggesting') : g?.source ? 'suggestAgain' : 'suggest';
  return `<div class="suggest stack">
    <button type="button" class="btn btn--ghost btn--block" data-act="suggest" ${!state.clips.length || g?.busy || g?.again || state.busy ? 'disabled' : ''}>
      ${g?.busy ? '<span class="spin" aria-hidden="true"></span>' : ic('sparkle')}${es(label)}</button>
    ${g?.error ? `<p class="error" role="alert">${ic('warn')}${escapeHtml(g.error)}</p>` : ''}
    ${g?.fallback ? `<p class="hint">${ic('info')}${es('suggestFallback')}</p>` : ''}
    <p class="hint">${ic('info')}${es(!state.clips.length ? 'suggestNeed' : state.ai === 'local' ? (desktop ? 'suggestLocalPc' : 'suggestLocal') : state.ai ? 'suggestAi' : 'suggestBasic')}</p>
    ${g?.source && !g.busy ? `<button type="button" class="link-btn" data-act="undo">${ic('refresh')}${es('suggestUndo')}</button>` : ''}
  </div>`;
}

// ---------- Sections ----------

function renderWho() {
  const r = state.restaurant;
  if (desktop) {
    // Settings are in the top bar; until the restaurant is set, a button here points to them too.
    $('who').innerHTML = r
      ? `<p class="lbl">${ic('store')}${es('whoDesk', { name: pick(r.name) })}</p>`
      : `<p class="hint">${ic('info')}${es('setupNeed')}</p>
         <button type="button" class="btn btn--ghost btn--sm" data-act="settings">${ic('gear')}${es('settings')}</button>`;
    return;
  }
  $('who').innerHTML = r
    ? `<p class="lbl">${ic('store')}${es('whoIn', { name: pick(r.name) })}</p>
       ${r.profile?.media?.video ? `<p class="hint">${ic('info')}${es('hasVideo')}</p>` : ''}`
    : `<p class="hint">${ic('info')}${es('whoOut')}</p>
       <a class="btn btn--ghost btn--sm" href="/owner" target="_blank" rel="noopener">${ic('lock')}${es('login')}</a>`;
}

const heading = (n, key, name) => `<h2 class="sh"><span class="sh__n">${n}</span>${ic(name)}${es(key)}</h2>`;

const KIND_ICONS = { image: 'image', video: 'film', collage: 'grid' };

function clipHtml(c, i) {
  const n = state.clips.length;
  const maxDur = Math.min(LEN.max, c.kind === 'video' ? c.srcDur - c.offset : LEN.max);
  const minDur = Math.min(LEN.min, maxDur);
  const prev = state.clips[i - 1];
  const links = [];
  // Same words as the shot before: they stay on screen across both shots.
  if (prev?.caption.trim() && prev.caption !== c.caption && i < n - 1) links.push(`<button type="button" class="link-btn" data-act="same">${ic('copy')}${es('same')}</button>`);
  if (canMerge(c, state.clips[i + 1])) links.push(`<button type="button" class="link-btn" data-act="merge">${ic('grid')}${es('merge')}</button>`);
  if (c.kind === 'collage') links.push(`<button type="button" class="link-btn" data-act="split">${ic('image')}${es('split', { n: c.items.length })}</button>`);
  return `<li class="clip" data-id="${c.id}">
    <button type="button" class="clip__thumb" data-act="seek" aria-label="${es('show')}">
      <img src="${c.thumb}" alt="">
      <span class="clip__no">${i + 1}</span>
      <span class="clip__kind" title="${es(c.kind)}">${ic(KIND_ICONS[c.kind])}</span>
    </button>
    <div class="clip__body">
      ${i === n - 1 && n > 1
        ? `<p class="hint">${ic('info')}${es('lastNote')}</p>`
        : `<label class="input input--sm">${ic('type')}<input data-field="caption" value="${escapeHtml(c.caption)}" maxlength="60" placeholder="${es('caption')}" aria-label="${es('caption')}"></label>
           ${picksHtml('caption', state.sugg?.captions?.[c.id], c.caption, `c${c.id}`)}`}
      <div class="clip__row">
        <span class="small muted">${es('len')}</span>
        <div class="stepper stepper--sm" role="group" aria-label="${es('len')}">
          <button type="button" data-act="len" data-delta="-1" ${c.dur <= minDur + 0.001 ? 'disabled' : ''} aria-label="−">${ic('minus')}</button>
          <output>${fmtSec(c.dur)}</output>
          <button type="button" data-act="len" data-delta="1" ${c.dur >= maxDur - 0.001 ? 'disabled' : ''} aria-label="+">${ic('plus')}</button>
        </div>
        <span class="clip__acts">
          <button type="button" class="icon-btn icon-btn--sm" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="${es('up')}">${ic('up')}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="${es('down')}">${ic('down')}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-act="del" aria-label="${es('del')}">${ic('trash')}</button>
        </span>
      </div>
      ${c.kind === 'video' && c.srcDur - c.dur > 0.05 ? `
        <label class="clip__range"><span>${es('startAt', { s: fmtSec(c.offset) })}</span>
          <input type="range" data-field="offset" min="0" max="${(c.srcDur - c.dur).toFixed(2)}" step="0.1" value="${c.offset}"></label>` : ''}
      ${links.length ? `<div class="clip__links">${links.join('')}</div>` : ''}
    </div>
  </li>`;
}

function renderClips() {
  const full = state.clips.length >= MAX_CLIPS;
  $('s-clips').innerHTML = `
    ${heading(1, 's1', 'image')}
    <p class="hint">${ic('sparkle')}${es('tip')}</p>
    ${state.clips.length
      ? `<ol class="clips">${state.clips.map(clipHtml).join('')}</ol>`
      : `<div class="clips-empty">${ic('film', 'ic--lg')}<span>${es(canDrop ? 'emptyDrop' : 'empty')}</span></div>`}
    ${state.loadErrors.map((m) => `<p class="error" role="alert">${ic('warn')}${escapeHtml(m)}</p>`).join('')}
    <div class="clip-add">
      <label class="btn btn--pink ${full || state.busy ? 'is-off' : ''}">
        ${state.busy ? '<span class="spin" aria-hidden="true"></span>' : ic('plus')}${es('add')}
        <input id="file" type="file" accept="image/*,video/*" multiple ${full ? 'disabled' : ''} class="visually-hidden">
      </label>
      ${state.clips.length ? '' : `<button type="button" class="btn btn--ghost" data-act="sample">${ic('sparkle')}${es('sample')}</button>`}
    </div>`;
}

function renderText() {
  const field = (key, value, extra = '') => `
    <div class="field"><label class="field__label" for="tx-${key}">${es(key)}</label>
      <input id="tx-${key}" data-text="${key}" value="${escapeHtml(value)}" maxlength="${{ name: 40, jname: 6 }[key] ?? 70}" ${extra}>
      ${picksHtml(key, state.sugg?.[key], value)}</div>`;
  $('s-text').innerHTML = `
    ${heading(2, 's2', 'type')}
    ${suggestHtml()}
    ${field('name', state.name)}
    ${field('jname', state.jname, `placeholder="${es('jnamePh')}" lang="ja"`)}
    ${field('catch', state.catch, `placeholder="${es('catchPh')}"`)}
    ${field('outro', state.outro)}
    <p class="hint">${ic('globe')}${es('english')}</p>`;
}

function renderStyle() {
  $('s-style').innerHTML = `
    ${heading(3, 's3', 'music')}
    <div class="field"><span class="field__label">${es('look')}</span>
      <div class="looks">${Object.keys(LOOKS).map((k) => `
        <button type="button" class="look" data-act="tpl" data-key="${k}" aria-pressed="${state.template === k}">
          <span class="look__sw look__sw--${k}"><span>${k === 'lively' ? 'AA' : 'Aa'}</span></span>${es(`tpl.${k}`)}</button>`).join('')}
      </div>
      <p class="hint">${ic('info')}${es('lookHint')}</p></div>
    <div class="field"><span class="field__label">${es('transition')}</span>
      <div class="chips chips--wrap">${Object.keys(TRANSITIONS).map((k) => `
        <button type="button" class="chip" data-act="tr" data-key="${k}" aria-pressed="${state.transition === k}">${es(`tr.${k}`)}</button>`).join('')}
      </div></div>
    <div class="field"><span class="field__label">${es('music')}</span>
      <div class="chips chips--wrap">${MUSIC.map((k) => `
        <button type="button" class="chip" data-act="music" data-key="${k}" aria-pressed="${state.music === k}">${es(`m.${k}`)}</button>`).join('')}
      </div></div>
    <p class="hint">${ic('info')}${es('musicHint')}</p>`;
}

const fileName = (ext) => `${(state.name.trim() || 'eatnow').replace(/[\\/:*?"<>|\s]+/g, '-')}-video.${ext}`;

function renderExport() {
  const len = total();
  const notice = state.notice ? `<p class="${state.notice.kind === 'error' ? 'error' : 'notice'}" role="alert">${ic('warn')}${escapeHtml(state.notice.text)}</p>` : '';
  let body;
  if (state.rec) {
    body = `
      <div class="recbar" aria-hidden="true"><span id="recbar"></span></div>
      <p class="lbl" id="reclabel" aria-live="polite">${es('rec', { p: 0 })}</p>
      <p class="hint">${ic('info')}${es('keep')}</p>
      <button type="button" class="btn btn--ghost" data-act="stop">${ic('x')}${es('stop')}</button>`;
  } else if (state.result) {
    const { url, ext, blob, seconds } = state.result;
    const r = state.restaurant;
    body = `
      <div class="result">
        <video src="${url}" controls playsinline loop></video>
        <div class="stack">
          <p class="lbl">${ic('check')}${es('ready')}</p>
          <p class="small muted num">${fmtTime(seconds)} · ${(blob.size / 1e6).toFixed(1)} MB · ${ext.toUpperCase()}</p>
          ${desktop
            ? !savesToFile ? '' : `${state.saved ? `<p class="notice notice--ok">${ic('check')}${es('savedTo', { path: state.saved })}</p>
                 <button type="button" class="btn btn--ghost" data-act="show-file">${ic('folder')}${es('showFile')}</button>` : ''}
               <button type="button" class="btn ${state.saved ? 'btn--ghost' : 'btn--pink btn--lg'}" data-act="save-file" ${state.posting ? 'disabled' : ''}>${ic('download')}${es(state.saved ? 'saveAgain' : 'saveFile')}</button>`
            : state.posted
            ? `<p class="notice notice--ok">${ic('check')}${es('posted')}</p>
               <a class="btn btn--ghost" href="/r/${encodeURIComponent(r.id)}">${ic('store')}${es('page')}</a>`
            : r
              ? `<button type="button" class="btn btn--pink btn--lg" data-act="post" ${state.posting ? 'disabled' : ''}>${ic('upload')}${es(state.posting ? 'posting' : 'post')}</button>
                 ${r.profile?.media?.video ? `<p class="hint">${ic('info')}${es('hasVideo')}</p>` : ''}`
              : `<a class="btn btn--pink btn--lg" href="/owner" target="_blank" rel="noopener">${ic('lock')}${es('loginToPost')}</a>`}
          ${savesToFile ? '' : `<a class="btn ${desktop ? 'btn--pink btn--lg' : 'btn--ghost'}" href="${url}" download="${escapeHtml(fileName(ext))}">${ic('download')}${es('save')}</a>`}
          <button type="button" class="link-btn" data-act="again">${ic('refresh')}${es('again')}</button>
        </div>
      </div>`;
  } else {
    const warn = !state.clips.length ? s('need') : len > MAX_TOTAL ? s('tooLong') : len > LONG_TOTAL ? s('long') : '';
    const low = state.maxMB && state.clips.length && rates(len).video < 1_000_000;
    body = `
      ${warn ? `<p class="hint">${ic(len > MAX_TOTAL ? 'warn' : 'info')}${escapeHtml(warn)}</p>` : ''}
      <div class="field"><span class="field__label">${es('size')}</span>
        <div class="chips chips--wrap">${SIZES.map((n) => `
          <button type="button" class="chip" data-act="size" data-mb="${n}" aria-pressed="${state.maxMB === n}">${n ? es('sizeMax', { n }) : es('sizeAny')}</button>`).join('')}
        </div></div>
      ${state.clips.length ? `<p class="hint">${ic(low ? 'warn' : 'info')}${es('sizeEst', { mb: Math.max(0.1, estMB(Math.min(len, MAX_TOTAL))).toFixed(1) })}${low ? ` ${es('sizeLow')}` : ''}</p>` : ''}
      <button type="button" class="btn btn--pink btn--lg btn--block" data-act="record" ${!state.clips.length || len > MAX_TOTAL || state.busy ? 'disabled' : ''}>
        ${ic('film')}${es('go', { s: fmtTime(len) })}</button>
      <p class="hint">${ic('clock')}${es('keep')}</p>`;
  }
  $('s-export').innerHTML = `${heading(4, desktop ? 's4Desk' : 's4', desktop ? 'download' : 'upload')}${notice}${body}`;
}

function renderStatic() {
  document.title = t('title.studio');
  updatePlayButton();
}

function renderAll() {
  renderStatic();
  renderWho();
  renderClips();
  renderText();
  renderStyle();
  renderExport();
  renderOverlay();
  updateClock();
}

// ---------- Events ----------

const clipOf = (el) => state.clips.find((c) => c.id === Number(el.closest('[data-id]')?.dataset.id));

$('s-clips').addEventListener('change', (ev) => {
  if (ev.target.id === 'file') {
    addFiles(ev.target.files);
    ev.target.value = '';
  }
});

$('s-clips').addEventListener('input', (ev) => {
  const clip = clipOf(ev.target);
  if (!clip) return;
  if (ev.target.dataset.field === 'caption') {
    clip.caption = ev.target.value;
    syncPicks(ev.target.closest('.clip'), 'caption', clip.caption);
    clearResultQuietly();
  } else if (ev.target.dataset.field === 'offset') {
    clip.offset = Number(ev.target.value);
    ev.target.previousElementSibling.textContent = s('startAt', { s: fmtSec(clip.offset) });
    state.t = tl().segments[clip.index].start;
    clearResultQuietly();
  }
  if (state.playing) stopPlayback();
  requestDraw();
});

$('s-clips').addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'sample') {
    state.clips.push(...sampleClips());
    state.loadErrors = [];
    return clipsChanged();
  }
  const clip = clipOf(btn);
  if (!clip) return;
  const i = state.clips.indexOf(clip);
  if (act === 'seek') {
    if (state.playing) stopPlayback();
    state.t = tl().segments[i].start + 0.01;
    return requestDraw();
  }
  if (act === 'len') {
    const maxDur = Math.min(LEN.max, clip.kind === 'video' ? clip.srcDur - clip.offset : LEN.max);
    clip.dur = Math.min(maxDur, Math.max(Math.min(LEN.min, maxDur), clip.dur + Number(btn.dataset.delta) * LEN.step));
    clip.dur = Math.round(clip.dur * 10) / 10;
  } else if (act === 'up' && i > 0) {
    [state.clips[i - 1], state.clips[i]] = [state.clips[i], state.clips[i - 1]];
  } else if (act === 'down' && i < state.clips.length - 1) {
    [state.clips[i + 1], state.clips[i]] = [state.clips[i], state.clips[i + 1]];
  } else if (act === 'del') {
    removeClip(clip);
  } else if (act === 'same') {
    clip.caption = state.clips[i - 1].caption;
  } else if (act === 'again-words') {
    return suggestAgain('caption', clip);
  } else if (act === 'pick') {
    clip.caption = state.sugg.captions[clip.id][Number(btn.dataset.i)].text;
  } else if (act === 'merge') {
    mergeWithNext(i);
  } else if (act === 'split') {
    splitCollage(i);
  }
  clipsChanged();
});

$('s-text').addEventListener('input', (ev) => {
  const key = ev.target.dataset.text;
  if (!key) return;
  state[key] = ev.target.value;
  syncPicks($('s-text'), key, state[key]);
  clearResultQuietly();
  renderOverlay();
  requestDraw();
});

$('s-text').addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-act]');
  if (!btn) return;
  const { act } = btn.dataset;
  if (act === 'suggest') return suggest();
  if (act === 'undo') return undoSuggest();
  if (act === 'again-words') return suggestAgain(btn.dataset.field);
  if (act === 'pick') {
    const key = btn.dataset.pick;
    state[key] = state.sugg[key][Number(btn.dataset.i)].text;
    clearResultQuietly();
    renderText();
    renderOverlay();
    requestDraw();
  }
});

$('s-style').addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-act]');
  if (!btn) return;
  const { act, key } = btn.dataset;
  // A look comes with the transition that suits it (it can still be changed); music stays as chosen.
  if (act === 'tpl') Object.assign(state, { template: key, transition: LOOKS[key].transition });
  if (act === 'tr') state.transition = key;
  if (act === 'music') state.music = key;
  if (state.playing && act !== 'tr') { // hear the new music right away
    stopPlayback();
    startPlayback();
  } else if (state.playing) stopPlayback();
  clearResultQuietly();
  renderStyle();
  requestDraw();
});

$('s-export').addEventListener('click', (ev) => {
  const act = ev.target.closest('[data-act]')?.dataset.act;
  if (act === 'record') startRecording();
  else if (act === 'size') {
    state.maxMB = Number(ev.target.closest('[data-mb]').dataset.mb);
    state.squeeze = 1;
    try { localStorage.setItem(SIZE_KEY, String(state.maxMB)); } catch {}
    renderExport();
  }
  else if (act === 'stop') finishRecording(true);
  else if (act === 'post') post();
  else if (act === 'save-file') saveFile();
  else if (act === 'show-file') desktop.showVideo(state.saved);
  else if (act === 'again') {
    clearResult();
    renderExport();
    $('s-clips').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Editing after a video is made drops the made video, so the posted file always matches the preview.
function clearResultQuietly() {
  if (!state.result || state.posting) return;
  clearResult();
  renderExport();
}

$('play').addEventListener('click', () => {
  if (state.playing) {
    stopPlayback();
    requestDraw();
  } else startPlayback();
});

$('scrub').addEventListener('input', (ev) => {
  if (state.playing) stopPlayback();
  state.t = Number(ev.target.value);
  requestDraw();
});

$('overlay').addEventListener('change', (ev) => {
  state.overlay = ev.target.checked;
  renderOverlay();
});

window.addEventListener('beforeunload', (ev) => {
  if (state.clips.length && !state.posted && !state.saved) ev.preventDefault();
});

// ---------- Start ----------

async function loadOwner() {
  if (!state.token && !desktop) return;
  try {
    const { restaurant, studioAi } = desktop
      ? await desktop.profile()
      : await api('/api/owner/me', { headers: { Authorization: `Bearer ${state.token}` } });
    state.restaurant = restaurant;
    state.ai = studioAi || false; // 'claude', 'local' (a model on our own server or computer) or false
    if (!restaurant) return;
    // The feed is watched mostly by visitors, so the name on the video starts in English.
    if (!state.name) state.name = restaurant.name?.en || pick(restaurant.name);
    if (!state.jname) state.jname = (restaurant.name?.ja || '').replace(/\s+/g, '');
  } catch (err) {
    if (err.status === 401) state.token = null;
  }
}

// Logging in happens on the dashboard in another tab, so the work here isn't lost.
window.addEventListener('focus', () => {
  if (state.restaurant || desktop) return;
  try { state.token = localStorage.getItem(TOKEN_KEY); } catch {}
  if (state.token) loadOwner().then(() => { renderWho(); renderText(); renderExport(); renderOverlay(); });
});

// In the desktop app, the settings (desktop/renderer/settings.js) say when they change.
window.addEventListener('eatnow:settings', () => loadOwner().then(renderAll));
$('who').addEventListener('click', (ev) => {
  if (ev.target.closest('[data-act="settings"]')) window.dispatchEvent(new Event('eatnow:open-settings'));
});

canvas.width = W;
canvas.height = H;
initI18n();
onLangChange(renderAll);
renderAll();
loadOwner().then(renderAll);
