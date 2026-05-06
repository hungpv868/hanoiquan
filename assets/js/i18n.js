/* HanoiQuan — i18n
 *
 * Runtime translation engine.
 *   - 3 locales: fr (default), en, vi.
 *   - Locale = whatever was last saved in localStorage; FR otherwise.
 *   - Switching does NOT reload the page: text is swapped in-place.
 *   - Fallback chain: current locale → fr → key (with console warn).
 *
 * Markup contract
 *   data-i18n="key"             → element.textContent
 *   data-i18n-html="key"        → element.innerHTML  (use for keys with <br>, <a>, <sup>...)
 *   data-i18n-attr="attr:key"   → element.setAttribute(attr, value)
 *                                 multiple pairs separated by ";"
 *
 * Document title + <meta name="description"> are derived from
 *   meta.<page>.title  /  meta.<page>.description
 * where <page> = body[data-page].
 *
 * After every successful switch, dispatches `i18n:locale-changed`
 * (CustomEvent on window) so other modules (e.g. theme.js) can react.
 */

const STORAGE_KEY    = 'hanoiquan-locale';
const SUPPORTED      = ['fr', 'en', 'vi'];
const DEFAULT_LOCALE = 'fr';

const cache = Object.create(null);
let currentLocale = DEFAULT_LOCALE;

/* -------- low-level helpers -------- */

async function loadLocale(locale) {
  if (cache[locale]) return cache[locale];
  try {
    const res = await fetch(`/assets/i18n/${locale}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cache[locale] = await res.json();
    return cache[locale];
  } catch (e) {
    console.warn(`[i18n] failed to load "${locale}":`, e.message);
    cache[locale] = null;
    return null;
  }
}

function lookup(dict, path) {
  if (!dict) return undefined;
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), dict);
}

/** Public translation accessor with fallback to FR. */
export function t(key) {
  const v = lookup(cache[currentLocale], key);
  if (v !== undefined) return v;
  const fb = lookup(cache[DEFAULT_LOCALE], key);
  if (fb !== undefined) return fb;
  console.warn(`[i18n] missing key "${key}" in "${currentLocale}" and "${DEFAULT_LOCALE}"`);
  return key;
}

export function getLocale() { return currentLocale; }

/* -------- DOM apply -------- */

function applyTextNodes() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = lookup(cache[currentLocale], el.dataset.i18n)
           ?? lookup(cache[DEFAULT_LOCALE], el.dataset.i18n);
    if (typeof v === 'string') el.textContent = v;
  });
}

function applyHtmlNodes() {
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = lookup(cache[currentLocale], el.dataset.i18nHtml)
           ?? lookup(cache[DEFAULT_LOCALE], el.dataset.i18nHtml);
    if (typeof v === 'string') el.innerHTML = v;
  });
}

function applyAttrNodes() {
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(';').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s && s.trim());
      if (!attr || !key) return;
      const v = lookup(cache[currentLocale], key)
             ?? lookup(cache[DEFAULT_LOCALE], key);
      if (typeof v === 'string') el.setAttribute(attr, v);
    });
  });
}

function applyMeta() {
  const page = document.body?.dataset.page;
  if (!page) return;

  const title = lookup(cache[currentLocale], `meta.${page}.title`)
             ?? lookup(cache[DEFAULT_LOCALE], `meta.${page}.title`);
  if (typeof title === 'string') document.title = title;

  const desc = lookup(cache[currentLocale], `meta.${page}.description`)
            ?? lookup(cache[DEFAULT_LOCALE], `meta.${page}.description`);
  const metaEl = document.querySelector('meta[name="description"]');
  if (metaEl && typeof desc === 'string') metaEl.setAttribute('content', desc);
}

function applyAll() {
  applyTextNodes();
  applyHtmlNodes();
  applyAttrNodes();
  applyMeta();
  document.documentElement.setAttribute('lang', currentLocale);
}

/* -------- switcher UI -------- */

function syncSwitcherLabel() {
  const toggle = document.querySelector('.lang-switcher__toggle');
  if (toggle) toggle.textContent = currentLocale.toUpperCase();
}

function bindSwitcher() {
  const switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;

  const toggle = switcher.querySelector('.lang-switcher__toggle');
  const menu   = switcher.querySelector('.lang-switcher__menu');

  toggle?.addEventListener('click', () => {
    const open = switcher.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  menu?.querySelectorAll('button[data-lang]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lang = btn.dataset.lang;
      switcher.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      if (!SUPPORTED.includes(lang) || lang === currentLocale) return;
      await setLocale(lang);
    });
  });

  document.addEventListener('click', e => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && switcher.classList.contains('is-open')) {
      switcher.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.focus();
    }
  });
}

/* -------- public API -------- */

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStored(locale) {
  try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
}

export async function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  // Always keep FR loaded so fallback works.
  await loadLocale(DEFAULT_LOCALE);
  if (locale !== DEFAULT_LOCALE) await loadLocale(locale);
  currentLocale = locale;
  writeStored(locale);
  applyAll();
  syncSwitcherLabel();
  window.dispatchEvent(new CustomEvent('i18n:locale-changed', { detail: { locale } }));
}

export async function initI18n() {
  const stored = readStored();
  const initial = SUPPORTED.includes(stored) ? stored : DEFAULT_LOCALE;
  await setLocale(initial);
  bindSwitcher();
}
