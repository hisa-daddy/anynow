// EatNow Studio (desktop): the settings sheet. The restaurant's details stand in for the
// owner's account on the web, and the AI choice decides how words are suggested. The app
// (main.js) stores them; the Claude key goes in but never comes back out to the page.
// Choosing the local AI and saving sets it up: the app downloads and runs it (local-ai.js),
// and the sheet shows how far along it is.

import { t, e, escapeHtml, getLang, onLangChange } from './i18n.js';
import { ic, CUISINE_ART } from './ui.js';

const desktop = window.eatnowDesktop;
// The studio with no server (studio-static/) offers no AI, so there is nothing to choose.
const CHOICES = desktop.aiChoices || ['none', 'claude', 'local'];
const sheet = document.getElementById('settings');
let current = null; // what the app last said: { restaurant, ai: { mode, hasKey }, cuisines }
let local = null; // the local AI's state: { ready, busy, progress, error, size, ramOk, diskOk, downloadBytes, ... }
let draft = null; // the form while open, kept across language switches

const field = (name, label, value, attrs = '') => `
  <label class="field"><span class="field__label">${e(label)}</span>
    <input name="${name}" value="${escapeHtml(value)}" ${attrs}></label>`;

// The form as typed. Fields not on screen (another AI choice's) keep what the draft had.
function read() {
  const f = new FormData(sheet.querySelector('form'));
  const kept = { key: draft.ai.key };
  const v = (k) => String(f.get(k) ?? kept[k] ?? '');
  return {
    restaurant: {
      name: { en: v('nameEn'), ja: v('nameJa') },
      cuisine: v('cuisine'),
      hours: { open: v('open'), close: v('close') },
    },
    ai: { mode: v('mode'), key: v('key') },
  };
}

const bytes = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}GB` : `${Math.round(n / 1e6)}MB`);

// The local AI's part of the sheet: what it needs, how far setting up is, or that it is ready.
function localHtml() {
  if (!local) return '';
  const p = local.progress;
  if (local.busy) {
    const pct = p?.total ? Math.floor((p.received / p.total) * 100) : null;
    const label = p?.step === 'engine' ? 'dk.lpEngine' : p?.step === 'model' ? 'dk.lpModel' : p?.step === 'unpack' ? 'dk.lpUnpack' : p?.step === 'start' ? 'dk.lpStart' : 'dk.lpWait';
    return `<div class="stack desk-local" role="status">
      <p class="lbl"><span class="spin" aria-hidden="true"></span>${escapeHtml(t(label, { p: pct ?? 0, a: bytes(p?.received || 0), b: bytes(p?.total || 0) }))}</p>
      <progress class="desk-progress" max="100" ${pct == null ? '' : `value="${pct}"`}></progress>
      <p class="hint">${e('dk.lpKeep')}</p>
      <button type="button" class="link-btn" data-act="local-cancel">${ic('x')}${e('dk.cancel')}</button>
    </div>`;
  }
  if (local.ready) {
    return `<div class="stack desk-local">
      <p class="notice notice--ok">${ic('check')}${e('dk.localReady')}</p>
      ${local.size ? `<button type="button" class="link-btn" data-act="local-remove">${ic('trash')}${escapeHtml(t('dk.localRemove', { size: bytes(local.size) }))}</button>` : ''}
    </div>`;
  }
  if (!local.supported) return `<p class="error">${ic('warn')}${e('err.LOCAL_AI_UNSUPPORTED')}</p>`;
  if (!local.ramOk) return `<p class="error">${ic('warn')}${e('err.LOCAL_AI_MEMORY')}</p>`;
  return `<div class="stack desk-local">
    <p class="hint">${escapeHtml(t('dk.localFirst', { size: bytes(local.downloadBytes) }))}</p>
    ${!local.diskOk ? `<p class="error">${ic('warn')}${escapeHtml(t('dk.localDisk', { size: bytes(local.diskBytes) }))}</p>` : ''}
    ${local.error ? `<p class="error" role="alert">${ic('warn')}${e(`err.${local.error}`)}</p>` : ''}
  </div>`;
}

const renderLocal = () => {
  const box = sheet.querySelector('#local-ai');
  if (box) box.innerHTML = localHtml();
};

function render(error = '') {
  const r = draft.restaurant || {};
  const ai = draft.ai;
  // The three choices side by side as cards, each with the same short facts (quality as stars,
  // speed, cost, where the stills go), so the owner can compare them at a glance.
  const fact = (icon, label, value) => `<span class="desk-ai__fact" title="${e(label)}">${ic(icon)}<span class="visually-hidden">${e(label)}: </span>${e(value)}</span>`;
  const card = (key, icon, stars) => `
    <label class="desk-ai ${ai.mode === key ? 'is-on' : ''}">
      <input type="radio" class="visually-hidden" name="mode" value="${key}" ${ai.mode === key ? 'checked' : ''}>
      <span class="desk-ai__head">${ic(icon)}<strong>${e(`dk.ai${key[0].toUpperCase()}${key.slice(1)}`)}</strong></span>
      <span class="desk-ai__tag">${e(`dk.${key}Tag`)}</span>
      <span class="desk-ai__stars" title="${e('dk.specQ')}" aria-label="${e('dk.specQ')} ${stars}/3">${[1, 2, 3].map((n) => ic('star', n <= stars ? 'is-on' : '')).join('')}</span>
      ${fact('bolt', 'dk.specS', `dk.${key}S`)}
      ${fact('card', 'dk.specC', `dk.${key}C`)}
      ${fact(key === 'claude' ? 'cloud' : 'laptop', 'dk.specD', `dk.${key}D`)}
    </label>`;
  const extra = ai.mode === 'claude' ? `
      <div class="stack desk-extra">
        ${field('key', 'dk.key', ai.key || '', `type="password" autocomplete="off" placeholder="${current.ai.hasKey ? e('dk.keySaved') : 'sk-ant-…'}"`)}
        <p class="hint">${ic('lock')}${e('dk.keyNote')}</p>
        ${current.ai.hasKey ? `<button type="button" class="link-btn" data-act="clear-key">${ic('trash')}${e('dk.keyClear')}</button>` : ''}
      </div>` : ai.mode === 'local' ? `<div class="desk-extra" id="local-ai">${localHtml()}</div>` : '';
  sheet.innerHTML = `
    <form method="dialog" class="desk-form">
      <div class="sheet__bar"><span class="spacer"></span><h2 id="settings-title">${e('st.settings')}</h2>
        <button type="button" data-act="cancel" aria-label="${e('dk.cancel')}">${ic('x')}</button></div>
      <div class="sheet__body">
        <section class="stack">
          <h3 class="sh">${ic('store')}${e('dk.shop')}</h3>
          <div class="grid2">${field('nameEn', 'dk.nameEn', r.name?.en ?? '', 'autocomplete="off" autofocus')}${field('nameJa', 'dk.nameJa', r.name?.ja ?? '', 'autocomplete="off"')}</div>
          <label class="field"><span class="field__label">${e('dk.cuisine')}</span>
            <select name="cuisine">${current.cuisines.map((c) => `<option value="${c}" ${(r.cuisine || 'japanese') === c ? 'selected' : ''}>${CUISINE_ART[c]?.[0] || ''} ${e(`cuisine.${c}`)}</option>`).join('')}</select></label>
          <div class="grid2">${field('open', 'dk.open', r.hours?.open ?? '', 'type="time"')}${field('close', 'dk.close', r.hours?.close ?? '', 'type="time"')}</div>
        </section>
        <section class="stack">
          <h3 class="sh">${ic('sparkle')}${e('dk.ai')}</h3>
          ${CHOICES.length > 1 ? `<p class="hint">${ic('lock')}${e('dk.noTrain')}</p>` : ''}
          ${CHOICES.length > 1
            ? `<div class="desk-ais" role="radiogroup" aria-label="${e('dk.ai')}">${card('none', 'list', 1)}${card('claude', 'sparkle', 3)}${card('local', 'laptop', 2)}</div>`
            : `<input type="hidden" name="mode" value="none"><p class="hint">${ic('info')}${e('dk.aiOnlyNone')}</p>`}
          ${extra}
        </section>
        ${error ? `<p class="error" role="alert">${ic('warn')}${escapeHtml(error)}</p>` : ''}
        <div class="row desk-actions">
          <button type="button" class="btn btn--ghost" data-act="cancel">${e('dk.cancel')}</button>
          <button type="submit" class="btn btn--pink">${ic('check')}${e('dk.save')}</button>
        </div>
      </div>
    </form>`;
}

async function open() {
  [current, local] = await Promise.all([desktop.settings(), desktop.localAi.status()]);
  draft = { restaurant: current.restaurant, ai: { ...current.ai, key: '' } };
  render();
  if (!sheet.open) sheet.showModal();
}

sheet.addEventListener('change', (ev) => {
  if (ev.target.name !== 'mode') return;
  draft = { ...read(), ai: { ...read().ai } };
  render();
});

sheet.addEventListener('click', async (ev) => {
  const act = ev.target.closest('[data-act]')?.dataset.act;
  if (act === 'cancel') sheet.close();
  if (act === 'clear-key') {
    const next = await desktop.saveSettings({ ...read(), ai: { ...read().ai, key: '', clearKey: true } });
    if (next.error) return render(t(`err.${next.error}`));
    current = next;
    draft = { ...read(), ai: { ...read().ai, key: '' } };
    render();
    window.dispatchEvent(new Event('eatnow:settings'));
  }
  if (act === 'local-cancel') desktop.localAi.cancel();
  if (act === 'local-remove') {
    await desktop.localAi.remove();
    local = await desktop.localAi.status();
    renderLocal();
  }
});

// Progress comes from the app while setting up, even with the sheet closed.
desktop.localAi.onProgress(async (state) => {
  local = { ...(local || {}), ...state };
  if (!state.busy) local = await desktop.localAi.status(); // finished, stopped or failed
  if (sheet.open) renderLocal();
});

sheet.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  draft = read();
  const { restaurant, ai } = draft;
  if (!restaurant.name.en.trim() && !restaurant.name.ja.trim()) return render(t('dk.needName'));
  if (ai.mode === 'claude' && !ai.key.trim() && !current.ai.hasKey) return render(t('dk.needKey'));
  const next = await desktop.saveSettings(draft);
  if (next.error) return render(t(`err.${next.error}`));
  current = next;
  window.dispatchEvent(new Event('eatnow:settings'));
  // Choosing the local AI is all the owner does: setting it up starts here, and the sheet
  // stays open to show it (closing it doesn't stop it).
  local = await desktop.localAi.status();
  if (ai.mode === 'local' && !local.ready && !local.busy && local.supported && local.ramOk && local.diskOk) {
    desktop.localAi.prepare();
    local = { ...local, busy: true, error: null, progress: null };
    return render();
  }
  sheet.close();
});

document.getElementById('open-settings').addEventListener('click', open);
window.addEventListener('eatnow:open-settings', open);
onLangChange(() => {
  desktop.setLang(getLang());
  if (sheet.open) {
    draft = read();
    render();
  }
});
desktop.setLang(getLang());

// The first time, ask for the restaurant before anything else.
desktop.settings().then((s) => { if (!s.restaurant) open(); });
