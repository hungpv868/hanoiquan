/* HanoiQuan — theme toggle (light / dark)
 *
 * Source of truth: data-theme attribute on <html>.
 * Persistence:    localStorage["hanoiquan-theme"].
 * Bootstrap:      sync inline <script> in <head> sets the attribute
 *                 before first paint (no FOUC).
 *
 * The toggle aria-label is i18n-aware: it asks the i18n module for
 * "common.theme.toLight" / "common.theme.toDark" and re-syncs whenever
 * the locale changes (window event "i18n:locale-changed").
 */

import { t } from './i18n.js';

const STORAGE_KEY = 'hanoiquan-theme';

/* Mobile browser chrome color must match --bg-base of each theme. */
const META_THEME_COLOR = {
  dark:  '#1A1310',
  light: '#F7F1E3'
};

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStored(theme) {
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function syncToggle(theme) {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.setAttribute('aria-pressed', String(theme === 'light'));
  // Label describes the ACTION the click will perform.
  const labelKey = theme === 'light' ? 'common.theme.toDark' : 'common.theme.toLight';
  toggle.setAttribute('aria-label', t(labelKey));
}

function apply(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_THEME_COLOR[theme]);

  syncToggle(theme);
}

export function initTheme() {
  apply(currentTheme());

  const toggle = document.querySelector('.theme-toggle');
  toggle?.addEventListener('click', () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    apply(next);
    writeStored(next);
  });

  if (!readStored() && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener?.('change', e => {
      if (!readStored()) apply(e.matches ? 'light' : 'dark');
    });
  }

  // Re-translate the toggle aria-label whenever the user switches language.
  window.addEventListener('i18n:locale-changed', () => syncToggle(currentTheme()));
}
