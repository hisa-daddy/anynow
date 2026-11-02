// Built from src/studio-copy.js by studio-static/build.js.
import dep0 from './app-error.js';
const module = { exports: {} };
const require = (name) => ({ "./app-error": dep0 })[name];
(function (require, module, exports) {
'use strict';

const { AppError } = require('./app-error');

// Suggests the words for a video made in the studio: the catchphrase, a caption for each
// shot and the closing line. With ANTHROPIC_API_KEY set, Claude looks at a still from each
// shot and writes words that fit what is on screen. Without it, OLLAMA_URL points at a
// vision model running on our own machine instead (OLLAMA_MODEL, gemma4:12b by default),
// which writes the English only. With neither, suggestions come from the built-in phrases
// below, chosen by the restaurant's cuisine and area. Either way every field gets a few
// candidates, with their meaning in the owner's language where we have it.

const MODEL = 'claude-opus-5-5';
const OPTIONS = 3; // candidates per field
const MAX = { catch: 70, caption: 60, outro: 70 }; // the studio's input limits
const MAX_SHOTS = 10;
const MAX_IMAGES = 3; // per shot
const KINDS = ['image', 'video', 'collage'];
const LOCAL_MODEL = 'gemma4:12b';

function createCopywriter(env) {
  const key = env.ANTHROPIC_API_KEY;
  // ANTHROPIC_BASE_URL points at another endpoint, such as a stand-in for tests.
  const url = `${(env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '')}/v1/messages`;
  const local = !key && env.OLLAMA_URL
    ? { url: `${env.OLLAMA_URL.replace(/\/$/, '')}/api/chat`, model: env.OLLAMA_MODEL || LOCAL_MODEL }
    : null;
  const ask = key ? (restaurant, req) => askClaude(url, key, restaurant, req)
    : local ? (restaurant, req) => askLocal(local, restaurant, req)
    : null;
  return {
    ai: key ? 'claude' : local ? 'local' : false,
    async suggest(restaurant, input) {
      const req = checkInput(input);
      if (!ask) return { source: 'phrases', ...phrases(restaurant, req) };
      try {
        return { source: 'ai', ...complete(await ask(restaurant, req), restaurant, req) };
      } catch (err) {
        console.error('[studio-copy]', err.message);
        return { source: 'phrases', fallback: true, ...phrases(restaurant, req) };
      }
    },
  };
}

function checkInput(body) {
  const shots = Array.isArray(body.shots) ? body.shots : null;
  if (!shots || !shots.length || shots.length > MAX_SHOTS) throw new AppError('INVALID_INPUT');
  return {
    again: checkAgain(body.again, shots.length),
    look: ['elegant', 'simple', 'lively'].includes(body.look) ? body.look : 'simple',
    noteLang: body.noteLang === 'ja' ? 'ja' : 'en',
    round: Math.max(0, Math.min(99, Math.floor(Number(body.round) || 0))),
    shots: shots.map((s) => {
      const images = Array.isArray(s?.images) ? s.images : [];
      if (!KINDS.includes(s?.kind) || !images.length || images.length > MAX_IMAGES) throw new AppError('INVALID_INPUT');
      if (!images.every((d) => typeof d === 'string' && /^[A-Za-z0-9+/]+=*$/.test(d))) throw new AppError('INVALID_INPUT');
      return { kind: s.kind, seconds: Math.max(0, Math.min(60, Number(s.seconds) || 0)), count: images.length, images };
    }),
  };
}

// "Other ideas" for one field: { field: 'catch' | 'outro' | 'caption', shot (for a caption), avoid }.
// `avoid` is what the owner has already been shown for it.
function checkAgain(again, shots) {
  if (!again || !['catch', 'outro', 'caption'].includes(again.field)) return null;
  const shot = Math.floor(Number(again.shot) || 0);
  if (again.field === 'caption' && (shot < 0 || shot >= (shots > 1 ? shots - 1 : 1))) throw new AppError('INVALID_INPUT');
  const avoid = (Array.isArray(again.avoid) ? again.avoid : []).filter((t) => typeof t === 'string').map((t) => t.trim().slice(0, 80)).filter(Boolean).slice(-40);
  return { field: again.field, shot: again.field === 'caption' ? shot : 0, avoid };
}

// The last shot of a video with more than one carries the name and closing line instead of a caption.
const captioned = (req) => (req.shots.length > 1 ? req.shots.length - 1 : 1);

// ---------- Claude ----------

const option = { type: 'object', properties: { text: { type: 'string' }, note: { type: 'string' } }, required: ['text', 'note'], additionalProperties: false };
const options = { type: 'array', items: option };
const SCHEMA = {
  type: 'object',
  properties: {
    catch: options,
    captions: {
      type: 'array',
      items: { type: 'object', properties: { shot: { type: 'integer' }, options }, required: ['shot', 'options'], additionalProperties: false },
    },
    outro: options,
  },
  required: ['catch', 'captions', 'outro'],
  additionalProperties: false,
};

const TONE = {
  elegant: 'calm and refined',
  simple: 'friendly and plain',
  lively: 'upbeat and punchy; an exclamation mark now and then is fine',
};

const SYSTEM = `You write the on-screen words for short vertical videos that restaurants post on EatNow, an app that shows people in Tokyo which restaurants have a table free right now. Most viewers are visitors from abroad scrolling a feed, so the words are in simple, natural English that is read in a second or two.

A video has a title card with the restaurant's name and a catchphrase over the first shot, a caption over each shot after that, and the name with a closing line over the last shot. The frames from each shot are in time order, so the first shot's caption sits over its later frames. Good captions are short (usually two to six words), warm and concrete, and say something about what the viewer is seeing: the entrance, a chef at work, a dish, the room, the staff. When consecutive shots show the same kind of thing, such as several dishes, give them exactly the same caption so it stays on screen across them.

Only describe what you can see in the shots or what the restaurant's details say. Do not invent prices, awards, rankings, opening years, opening days or dish names you cannot identify, and avoid claims like "best in Tokyo". Name food only when it is clearly recognisable (for example nigiri, ramen or gyoza). Describe people by what they are doing, such as welcoming guests or cutting fish; do not guess who they are (owner, head chef) or say anything about their age or years of experience. The video stays up for weeks, so do not promise a free seat, a wait time or anything else that changes. The name is already on screen with the catchphrase and the closing line, so do not make either of them just the name.`;

const AGAIN_LABEL = { catch: () => 'the catchphrase', outro: () => 'the closing line', caption: (i) => `the caption of shot ${i + 1}` };

// The request body for a model: each shot's line followed by its stills, then the details and the task.
function prompt(restaurant, req) {
  const n = req.shots.length;
  const content = [];
  req.shots.forEach((shot, i) => {
    const what = shot.kind === 'collage' ? `a collage of ${shot.count} photos` : shot.kind === 'video' ? `a video clip, ${shot.count} frames from it` : 'a photo';
    const role = i === 0 ? 'the title card is shown over its start, then its caption' : n > 1 && i === n - 1 ? 'the name and closing line are shown over it, so it gets no caption' : 'it gets a caption';
    content.push({ type: 'text', text: `Shot ${i + 1} of ${n} (${what}, ${shot.seconds.toFixed(1)} s): ${role}.` });
    for (const data of shot.images) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
  });
  const facts = [
    `Name: ${restaurant.name?.en || ''}${restaurant.name?.ja ? ` (${restaurant.name.ja})` : ''}`,
    `Cuisine: ${restaurant.cuisine}`,
    restaurant.address?.en && `Address: ${restaurant.address.en}`,
    restaurant.hours && `Hours: ${restaurant.hours.open}-${restaurant.hours.close}`,
  ].filter(Boolean).join('\n');
  const shotsToCaption = Array.from({ length: captioned(req) }, (_, i) => i + 1).join(', ');
  const note = req.noteLang === 'ja'
    ? 'The owner reads Japanese: in "note", give what each line means in natural Japanese.'
    : 'Leave "note" as an empty string.';
  content.push({
    type: 'text',
    text: `Restaurant details:\n${facts}\n\nThe video's style is ${TONE[req.look]}; match that tone.\n\n` +
      `Give ${OPTIONS} different options for the catchphrase (up to about 30 characters), for the caption of each of shots ${shotsToCaption} ` +
      `(up to about 35 characters), and for the closing line (up to about 30 characters). ` +
      `The first option for each should be the one you would pick. ${note}` +
      (req.round && !req.again ? `\n\nThe owner asked for new ideas (round ${req.round + 1}), so try different angles from the obvious ones.` : '') +
      (req.again ? `\n\nThe owner didn't like the options for ${AGAIN_LABEL[req.again.field](req.again.shot)} and asked for new ones. ` +
        `Give ${OPTIONS} fresh options for it that clearly differ from these: ${JSON.stringify(req.again.avoid)}. The other fields are not used this time, so keep them short.` : ''),
  });
  return content;
}

async function askClaude(url, key, restaurant, req) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2026-10-21',
      // If a request is declined, the API retries it on its recommended fallback model.
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: 'default',
      system: SYSTEM,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: prompt(restaurant, req) }],
    }),
    signal: AbortSignal.timeout(90 * 1000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${data.error?.message || ''}`);
  if (data.stop_reason !== 'end_turn') throw new Error(`Claude API stopped: ${data.stop_reason}`);
  const text = (data.content || []).find((b) => b.type === 'text')?.text;
  return JSON.parse(text);
}

// A local vision model through Ollama. In our check (2026-10-29) gemma4:12b answered in about a
// minute on an M4 Mac, but Ollama could not hold it to a schema, and its Japanese meanings were
// often wrong or in romaji, so the schema goes in the instructions and only English is asked for.
async function askLocal(local, restaurant, req) {
  // Given the schema itself, gemma4 tended to copy it out before answering and run out of room,
  // so it gets the shape as an example instead.
  const example = { catch: [{ text: '…', note: '' }], captions: [{ shot: 1, options: [{ text: '…', note: '' }] }], outro: [{ text: '…', note: '' }] };
  const system = `${SYSTEM}\n\nAnswer with only a JSON object shaped like this, with every list filled in: ${JSON.stringify(example)}`;
  // One message per line of the prompt, carrying the stills that follow it, so each shot's frames stay with it.
  const messages = [{ role: 'system', content: system }];
  for (const block of prompt(restaurant, { ...req, noteLang: 'en' })) {
    if (block.type === 'text') messages.push({ role: 'user', content: block.text, images: [] });
    else messages.at(-1).images.push(block.source.data);
  }
  // Without a schema, gemma4 now and then stops partway through the JSON (in our runs, about one
  // answer in three); asking again usually gets a whole one, so it gets up to three tries.
  let answer;
  for (let attempt = 1; !answer; attempt++) {
    const res = await fetch(local.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: local.model, messages, stream: false, think: false, options: { num_ctx: 16384, num_predict: 2048 } }),
      signal: AbortSignal.timeout(180 * 1000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${data.error || ''}`);
    try {
      answer = readJson(String(data.message?.content || ''));
    } catch (err) {
      err.message += ` (done: ${data.done_reason}, prompt ${data.prompt_eval_count}, output ${data.eval_count})`;
      if (attempt >= 3) throw err;
      console.error('[studio-copy] retrying:', err.message);
    }
  }
  // It may write meanings even though they weren't asked for; those are dropped.
  const plain = (list) => (Array.isArray(list) ? list.map((o) => ({ ...o, note: '' })) : list);
  return {
    catch: plain(answer?.catch),
    captions: Array.isArray(answer?.captions) ? answer.captions.map((c) => ({ ...c, options: plain(c?.options) })) : answer?.captions,
    outro: plain(answer?.outro),
  };
}

// The JSON object in a model's answer: as is, inside a code fence, or with words around it.
function readJson(text) {
  const bare = text.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
  try {
    return JSON.parse(bare);
  } catch {}
  const start = text.indexOf('{');
  let depth = 0;
  let inString = false;
  for (let i = Math.max(start, 0); start >= 0 && i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1));
      } catch {
        break;
      }
    }
  }
  throw new Error(`unreadable answer: ${JSON.stringify(text.slice(0, 160))}…${JSON.stringify(text.slice(-160))}`);
}

const JAPANESE = /[\u3040-\u30ff\u4e00-\u9fff]/;

// Tidies the model's answer and fills any gap from the built-in phrases. The name is already on
// screen, so a lone name is dropped and a leading one ("Tomo Sushi - See you soon") is cut off;
// a meaning that is meant to be Japanese but has none (romaji, say) is left out.
function complete(answer, restaurant, req) {
  const backup = phrases(restaurant, req);
  const names = [restaurant.name?.en, restaurant.name?.ja].filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const lead = names.length ? new RegExp(`^(?:${names.join('|')})[ \\t]*(?:[-–—:.,!、。][ \\t]*|\\n\\s*|$)`, 'i') : null;
  // One line of words: a leading name goes (also when the model put it on a line of its own).
  const text = (o) => {
    const t = String(o?.text ?? '').trim();
    return (lead ? t.replace(lead, '') : t).replace(/\s+/g, ' ').trim();
  };
  const note = (o) => {
    const n = String(o?.note ?? '').trim();
    return req.noteLang === 'ja' && !JAPANESE.test(n) ? '' : n;
  };
  const clean = (list, max) => (Array.isArray(list) ? list : [])
    .map((o) => ({ text: text(o).slice(0, max), note: note(o).slice(0, 120) }))
    .filter((o, i, all) => o.text && all.findIndex((x) => x.text === o.text) === i)
    .slice(0, OPTIONS);
  const pick = (list, max, fallback) => {
    const got = clean(list, max);
    return got.length ? got : fallback;
  };
  const byShot = new Map((Array.isArray(answer?.captions) ? answer.captions : []).map((c) => [Number(c?.shot), c?.options]));
  return {
    catch: pick(answer?.catch, MAX.catch, backup.catch),
    captions: backup.captions.map((fallback, i) => pick(byShot.get(i + 1), MAX.caption, fallback)),
    outro: pick(answer?.outro, MAX.outro, backup.outro),
  };
}

// ---------- Built-in phrases ----------

const w = (text, ja) => ({ text, ja });

const FOOD = {
  sushi: { en: 'sushi', ja: 'お寿司', good: w('Fresh', '新鮮な'), line: w('Sliced fresh, right in front of you', '目の前で、新鮮なネタを') },
  ramen: { en: 'ramen', ja: 'ラーメン', good: w('Hearty', '心も温まる'), line: w('A bowl worth slurping', 'すすりたくなる一杯') },
  izakaya: { en: 'izakaya food', ja: '居酒屋料理', good: w('Easygoing', '気軽な'), line: w('Small plates, big cheers', '小皿料理で、乾杯') },
  yakitori: { en: 'yakitori', ja: '焼き鳥', good: w('Smoky', '香ばしい'), line: w('Grilled skewer by skewer', '一本ずつ、焼き上げます') },
  yakiniku: { en: 'yakiniku', ja: '焼肉', good: w('Sizzling', 'ジュージュー焼ける'), line: w('Grill it your way', 'お好みの焼き加減で') },
  japanese: { en: 'Japanese food', ja: '和食', good: w('Seasonal', '季節の'), line: w('The flavors of the season', '季節の味わい') },
  italian: { en: 'Italian food', ja: 'イタリアン', good: w('Cozy', 'くつろげる'), line: w('Made to share', 'みんなで分けあって') },
  french: { en: 'French food', ja: 'フレンチ', good: w('Elegant', '上品な'), line: w('A little French treat', 'ちょっとしたフレンチのごちそう') },
  chinese: { en: 'Chinese food', ja: '中華', good: w('Piping hot', 'できたて熱々の'), line: w('Hot and ready to share', '熱々を、みんなで') },
  korean: { en: 'Korean food', ja: '韓国料理', good: w('Bold', 'しっかりした味の'), line: w('Bold flavors to share', 'みんなで分けあう、しっかりした味') },
  indian: { en: 'Indian food', ja: 'インド料理', good: w('Warmly spiced', 'スパイス香る'), line: w('Full of warm spices', 'スパイスたっぷり') },
  thai: { en: 'Thai food', ja: 'タイ料理', good: w('Bright', '鮮やかな'), line: w('Sweet, sour and spicy', '甘くて、酸っぱくて、辛い') },
  cafe: { en: 'coffee', ja: 'コーヒー', good: w('Relaxed', 'ほっとする'), line: w('Take a slow break', 'ゆっくりひと休み') },
  burger: { en: 'burgers', ja: 'バーガー', good: w('Juicy', 'ジューシーな'), line: w('Stacked high and juicy', 'ボリュームたっぷり、ジューシー') },
  bar: { en: 'drinks', ja: 'お酒', good: w('Easygoing', '気軽に楽しむ'), line: w('Your new favorite drink', 'お気に入りの一杯を') },
};
const DEFAULT_FOOD = { en: 'food', ja: '料理', good: w('Tasty', 'おいしい'), line: w('Every dish, made with care', '一皿ずつ、心をこめて') };

const OPENING = [w('Come on in', 'どうぞお入りください'), w('Welcome!', 'ようこそ'), w('Step inside', '中へどうぞ'), w('Find us here', 'ここにあります')];
const MIDDLE = [
  w('Made by hand, every day', '毎日、手づくりで'),
  w('Every dish, made with care', '一皿ずつ、心をこめて'),
  w('Made fresh to order', 'ご注文を受けてから作ります'),
  w('Something for everyone', 'みんなが楽しめるメニュー'),
  w('Plenty of room to relax', 'ゆったりくつろげます'),
  w('Friendly, easygoing service', '気さくなおもてなし'),
  w('Perfect with a drink', 'お酒にもぴったり'),
  w('Pull up a seat', 'どうぞお席へ'),
  w('A taste worth the trip', '足を運ぶ価値のある味'),
];
const OUTRO = [w("We can't wait to see you!", 'お会いできるのを楽しみにしています'), w('See you soon!', 'またお会いしましょう'), w('Drop by anytime', 'いつでもお気軽にどうぞ')];

// "2-21 Dogenzaka, Shibuya" -> "Shibuya"; "渋谷区道玄坂2-21" -> "渋谷".
function area(restaurant) {
  const en = String(restaurant.address?.en || '').split(',').map((x) => x.trim()).filter((x) => x && !/^tokyo$/i.test(x) && !/\d/.test(x)).pop() || '';
  const ja = (String(restaurant.address?.ja || '').replace(/^東京都/, '').match(/^(.+?)[区市町村]/) || [])[1] || '';
  return { en, ja };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// by may be negative: a video of one shot starts its only caption one step back.
const rotate = (list, by) => list.map((_, i) => list[(((i + by) % list.length) + list.length) % list.length]);

function phrases(restaurant, req) {
  const food = FOOD[restaurant.cuisine] || DEFAULT_FOOD;
  const where = area(restaurant);
  const as = (list) => list.slice(0, OPTIONS).map((p) => ({ text: p.text, note: req.noteLang === 'ja' ? p.ja : '' }));
  const catches = [
    where.en ? w(`${food.good.text} ${food.en} in ${where.en}`, `${where.ja || where.en}で味わう、${food.good.ja}${food.ja}`) : w(`${food.good.text} ${food.en}, made for you`, `あなたのための、${food.good.ja}${food.ja}`),
    w(`Your new favorite ${food.en} spot`, `お気に入りになる${food.ja}のお店`),
    w(`${cap(food.en)}, just around the corner`, `すぐそこで、${food.ja}を`),
    where.en ? w(`A taste of ${where.en}`, `${where.ja || where.en}の味`) : w('A taste worth the trip', '足を運ぶ価値のある味'),
  ];
  const middle = [food.line, ...MIDDLE.filter((p) => p.text !== food.line.text)];
  const captions = Array.from({ length: captioned(req) }, (_, i) => {
    if (i === 0 && req.shots.length > 1) return as(rotate(OPENING, req.round));
    // Each shot starts at a different place in the list, so neighbouring shots differ.
    return as(rotate(middle, (i - 1) * OPTIONS + req.round));
  });
  const out = { catch: as(rotate(catches, req.round)), captions, outro: as(rotate(OUTRO, req.round)) };
  if (req.again) {
    // Other ideas for one field: the phrases not shown yet first, then (when there aren't enough
    // of those) the ones already shown, so there are always a few to pick from.
    const { field, shot, avoid } = req.again;
    const list = field === 'catch' ? catches : field === 'outro' ? OUTRO : shot === 0 && req.shots.length > 1 ? OPENING : middle;
    const shown = list.filter((p) => avoid.includes(p.text));
    const pickFrom = [...list.filter((p) => !avoid.includes(p.text)), ...rotate(shown, req.round % Math.max(1, shown.length))];
    if (field === 'caption') out.captions[shot] = as(pickFrom);
    else out[field] = as(pickFrom);
  }
  return out;
}

module.exports = { createCopywriter, phrases };

})(require, module, module.exports);
export default module.exports;
