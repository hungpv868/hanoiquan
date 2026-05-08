/* HaNoiQuan — main entry
 * Loaded on every page. Initialises shared interactions.
 *
 * Order matters:
 *   1. Synchronous DOM helpers (skip-link, sticky header, mobile nav).
 *   2. await initI18n() — translations must be applied before
 *      theme.js reads them for the toggle aria-label.
 *   3. initTheme().
 *   4. initReveal() last, after content is in its translated form.
 */

import { initTheme } from './theme.js';
import { initI18n } from './i18n.js';

function initSkipLink() {
  const main = document.getElementById('main');
  if (main && !main.hasAttribute('tabindex')) {
    main.setAttribute('tabindex', '-1');
  }
}

function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 80);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-main');
  if (!toggle || !nav) return;

  function close() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      close();
      toggle.focus();
    }
  });
}

function initActiveNav() {
  /* Use anchor.pathname (resolved through <base>) so this works under any base path. */
  const path = window.location.pathname.replace(/\/+$/, '/');
  document.querySelectorAll('.nav-main a').forEach(a => {
    const aPath = a.pathname.replace(/\/+$/, '/');
    if (aPath === path) {
      a.setAttribute('aria-current', 'page');
    }
  });
}

function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
    return;
  }
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  items.forEach(el => io.observe(el));
}

/* Timeline (used on /seine/).
 * Each .seine-timeline__step is keyboard-focusable. The active step
 * is highlighted via .is-active. Activation sources:
 *   - click / Enter / Space   (explicit)
 *   - mouseenter              (preview)
 *   - IntersectionObserver    (passive, while scrolling)
 * Without JS, every step stays fully visible (CSS .has-timeline guards
 * the dimming so no-JS users see all content). */
function initTimeline() {
  const list = document.querySelector('.seine-timeline');
  const steps = list ? list.querySelectorAll('.seine-timeline__step') : [];
  if (!steps.length) return;

  // Mark the document so CSS can apply dimming only when JS is on.
  document.documentElement.classList.add('has-timeline');

  function setActive(target) {
    steps.forEach(s => {
      const active = s === target;
      s.classList.toggle('is-active', active);
      if (active) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
    });
  }

  steps.forEach((step) => {
    step.setAttribute('tabindex', '0');
    step.setAttribute('role', 'button');
    step.addEventListener('click',      () => setActive(step));
    step.addEventListener('mouseenter', () => setActive(step));
    step.addEventListener('focus',      () => setActive(step));
    step.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActive(step);
      }
    });
  });

  // Default: first step active.
  setActive(steps[0]);

  // Auto-advance based on scroll position.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target);
    }, { threshold: [0.6], rootMargin: '-20% 0px -30% 0px' });
    steps.forEach(s => io.observe(s));
  }
}

/* Menu filter (used on /14e/).
 * Items declare zero or more space-separated categories on
 * data-category. A chip with data-filter="<cat>" hides any item
 * whose categories do not include that value. data-filter="all"
 * shows everything. Without JS, all items remain visible. */
function initMenuFilter() {
  const chips = document.querySelectorAll('[data-filter]');
  const items = document.querySelectorAll('[data-category]');
  if (!chips.length || !items.length) return;

  const counter = document.querySelector('[data-menu-count]');

  function apply(filter) {
    let shown = 0;
    items.forEach(item => {
      const cats = (item.dataset.category || '').split(/\s+/).filter(Boolean);
      const match = filter === 'all' || cats.includes(filter);
      item.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    chips.forEach(c => {
      const active = c.dataset.filter === filter;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', String(active));
    });
    if (counter) counter.textContent = String(shown);
  }

  chips.forEach(chip => {
    chip.setAttribute('aria-pressed', String(chip.classList.contains('is-active')));
    chip.addEventListener('click', () => apply(chip.dataset.filter));
  });

  if (counter) counter.textContent = String(items.length);
}

/* Hero parallax (used on /seine/).
 * Translates the hero media slower than the scroll, giving depth.
 * Only runs while the hero is in viewport (cheap rAF loop, no work otherwise).
 * Skips entirely if the user prefers reduced motion. */
function initHeroParallax() {
  const media = document.querySelector('.lux-hero__media');
  const hero  = document.querySelector('.lux-hero');
  if (!media || !hero) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  let inView = true;
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { threshold: 0 })
    : null;
  if (io) io.observe(hero);

  let ticking = false;
  function update() {
    if (inView) {
      const y = window.scrollY;
      // Translate 30% of scroll distance — slower than content for parallax.
      media.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

async function init() {
  initSkipLink();
  initStickyHeader();
  initMobileNav();
  initActiveNav();
  await initI18n();   // load + apply translations first
  initTheme();        // theme reads i18n for aria-label
  initReveal();
  initMenuFilter();
  initTimeline();
  initHeroParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
