/* HanoiQuan — reservation page
 * Branch selector + form validation + success/reset flow.
 *
 * Validation rules
 *   - HTML5 native (required, type=email, type=date) + custom checks.
 *   - Error messages come from i18n (re-translate on locale change).
 *   - Branch selection is its own validation (no native constraint).
 *
 * UX
 *   - No reload, no alert.
 *   - On submit error: focus first invalid field.
 *   - On success: hide form, show success panel, scroll into view.
 *   - "Faire une autre réservation" button resets the form and brings
 *     it back into view, preserving any branch pre-fill from the URL.
 */

import { t } from './i18n.js';

const SUPPORTED_BRANCHES = ['14e', 'seine'];

/* -------- branch selector -------- */

function getBranchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const branch = params.get('branch');
  return SUPPORTED_BRANCHES.includes(branch) ? branch : null;
}

function selectBranch(branch) {
  document.querySelectorAll('.branch-select__option').forEach(btn => {
    const match = btn.dataset.branch === branch;
    btn.classList.toggle('is-selected', match);
    btn.setAttribute('aria-pressed', String(match));
  });
  const hidden = document.querySelector('input[name="branch"]');
  if (hidden) hidden.value = branch;
  document.querySelector('.branch-select')?.classList.remove('has-error');
}

function initBranchSelect() {
  const buttons = document.querySelectorAll('.branch-select__option');
  if (!buttons.length) return;

  const initial = getBranchFromUrl();
  if (initial) selectBranch(initial);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => selectBranch(btn.dataset.branch));
  });
}

/* -------- field-level validation -------- */

function errorKeyFor(field) {
  if (field.type === 'email' && field.value && !field.checkValidity()) {
    return 'pages.reservation.form.errorEmail';
  }
  if (field.type === 'date' && field.value) {
    const picked = new Date(field.value);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (picked < today) return 'pages.reservation.form.errorDate';
  }
  if (field.type === 'checkbox' && field.required && !field.checked) {
    return 'pages.reservation.form.errorRgpd';
  }
  if (!field.checkValidity()) return 'pages.reservation.form.errorRequired';
  return null;
}

function setFieldError(field, errorKey) {
  const wrap = field.closest('.form-field') || field.closest('.form-checkbox');
  if (!wrap) return;
  const errorEl = wrap.querySelector('.form-field__error');

  if (errorKey) {
    wrap.classList.add('has-error');
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = t(errorKey);
      errorEl.dataset.i18n = errorKey;        // so language switch re-translates
    }
  } else {
    wrap.classList.remove('has-error');
    field.removeAttribute('aria-invalid');
    if (errorEl) delete errorEl.dataset.i18n;
  }
}

function validateField(field) {
  const errorKey = errorKeyFor(field);
  setFieldError(field, errorKey);
  return errorKey === null;
}

/* Branch is not a native form field — separate check. */
function validateBranch() {
  const hidden = document.querySelector('input[name="branch"]');
  const fieldset = document.querySelector('.branch-select');
  const valid = !!hidden?.value;
  fieldset?.classList.toggle('has-error', !valid);
  return valid;
}

/* -------- success / reset -------- */

function showSuccess(form) {
  const success = document.querySelector('.reservation-success');
  if (!success) return;
  form.style.display = 'none';
  success.classList.add('is-visible');
  success.setAttribute('tabindex', '-1');
  success.focus();
  success.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm(form) {
  const success = document.querySelector('.reservation-success');

  form.reset();

  // Clear validation state from every field.
  form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));

  // Clear branch selection visuals + hidden value, then restore URL pre-fill.
  document.querySelectorAll('.branch-select__option').forEach(btn => {
    btn.classList.remove('is-selected');
    btn.setAttribute('aria-pressed', 'false');
  });
  document.querySelector('.branch-select')?.classList.remove('has-error');
  const hidden = form.querySelector('input[name="branch"]');
  if (hidden) hidden.value = '';

  const urlBranch = getBranchFromUrl();
  if (urlBranch) selectBranch(urlBranch);

  // Hide success panel, bring form back, focus first field.
  success?.classList.remove('is-visible');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  form.querySelector('input, select, textarea')?.focus();
}

/* -------- form wiring -------- */

function initFormValidation() {
  const form = document.querySelector('.reservation-form');
  if (!form) return;

  form.querySelectorAll('input, select, textarea').forEach(field => {
    const eventName = field.type === 'checkbox' ? 'change' : 'blur';
    field.addEventListener(eventName, () => validateField(field));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let allValid = validateBranch();
    form.querySelectorAll('input, select, textarea').forEach(field => {
      if (!validateField(field)) allValid = false;
    });
    if (!allValid) {
      // Branch error first, otherwise the first invalid field.
      if (document.querySelector('.branch-select.has-error')) {
        document.querySelector('.branch-select__option')?.focus();
      } else {
        form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
      }
      return;
    }
    // TODO: POST to Formspree (or chosen backend) here.
    showSuccess(form);
  });

  const resetBtn = document.querySelector('[data-reset-form]');
  resetBtn?.addEventListener('click', () => resetForm(form));
}

function init() {
  initBranchSelect();
  initFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
