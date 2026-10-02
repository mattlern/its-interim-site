/* ITS Intérim — candidature en 4 étapes */
(() => {
  'use strict';
  const ITS = window.ITS;
  const form = document.querySelector('[data-wizard]');
  if (!form) return;

  const $ = (s, r = form) => r.querySelector(s);
  const $$ = (s, r = form) => [...r.querySelectorAll(s)];
  const steps = $$('.wiz__step');
  const fill = $('[data-tape-fill]');
  const labels = $$('.tape__label');
  const counter = $('[data-step-count]');
  const prevBtn = $('[data-prev]');
  const nextBtn = $('[data-next]');
  const submitBtn = $('[data-submit]');
  const NAMES = ['Votre métier', 'Votre expérience', 'Où et quand', 'Vos coordonnées'];
  const KEY = 'its-candidature-brouillon';
  let current = 0;

  /* Candidature liée à une offre : postuler.html?offre=MP01 */
  const ref = new URLSearchParams(location.search).get('offre');
  if (ref) {
    const banner = $('[data-offer-banner]');
    banner.hidden = false;
    banner.querySelector('span').textContent = `Candidature pour l'offre ${ref.toUpperCase()}`;
    form.elements.offre.value = ref.toUpperCase();
  }

  /* « Autre métier » : champ libre */
  const other = $('[data-other]');
  const otherField = $('[data-other-field]');
  const syncOther = () => {
    otherField.hidden = !other.checked;
    otherField.querySelector('input').required = other.checked;
  };
  other.addEventListener('change', syncOther);

  /* Groupes obligatoires (cases et boutons radio) */
  const GROUPS = {
    0: [['metiers', 'Choisissez au moins un métier.']],
    1: [['experience', 'Choisissez votre niveau d\'expérience.']],
    2: [['disponibilite', 'Indiquez quand vous êtes disponible.']],
  };

  const validStep = (i) => {
    let ok = true;
    let first = null;
    (GROUPS[i] || []).forEach(([name, msg]) => {
      const inputs = $$(`[name="${name}"]`);
      const box = inputs[0].closest('[data-field]');
      const checked = inputs.some((x) => x.checked);
      ITS.setError(box, checked ? '' : msg);
      if (!checked) {
        ok = false;
        first ||= inputs[0];
      }
    });
    if (!ITS.validate(steps[i])) return false;
    if (first) first.focus();
    return ok;
  };

  /* Brouillon gardé dans le navigateur */
  const save = () => {
    const data = { _step: current };
    for (const el of form.elements) {
      if (!el.name || el.type === 'file' || el.type === 'hidden' || el.name === 'consentement') continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) (data[el.name] ||= []).push(el.value);
      } else if (el.value.trim()) data[el.name] = el.value;
    }
    ITS.store.set(KEY, data);
  };

  const restore = () => {
    const data = ITS.store.get(KEY);
    if (!data || !Object.keys(data).some((k) => k !== '_step' && k !== 'distance')) return 0;
    for (const el of form.elements) {
      if (!el.name || !(el.name in data) || el.type === 'file' || el.type === 'hidden') continue;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = [].concat(data[el.name]).includes(el.value);
      else el.value = data[el.name];
    }
    syncOther();
    $('[data-restore]').hidden = false;
    return Math.min(Number(data._step) || 0, steps.length - 1);
  };

  $('[data-restore-clear]').addEventListener('click', () => {
    form.reset();
    ITS.store.del(KEY);
    $$('.is-invalid').forEach((f) => ITS.setError(f, ''));
    syncOther();
    $('[data-restore]').hidden = true;
    go(0, 'back');
  });

  /* Navigation entre étapes */
  const go = (i, dir = 'next', focus = true) => {
    form.dataset.dir = dir;
    steps[current].classList.remove('is-active');
    current = i;
    steps[current].classList.add('is-active');
    fill.style.setProperty('--p', `${((current + 1) / steps.length) * 100}%`);
    labels.forEach((l, k) => l.classList.toggle('is-done', k <= current));
    counter.textContent = `Étape ${current + 1} sur ${steps.length} · ${NAMES[current]}`;
    prevBtn.hidden = current === 0;
    nextBtn.hidden = current === steps.length - 1;
    submitBtn.hidden = !nextBtn.hidden;
    if (!focus) return;
    save();
    const top = form.getBoundingClientRect().top;
    if (top < 0) form.scrollIntoView({ behavior: ITS.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    $('legend', steps[current])?.focus({ preventScroll: true });
  };

  nextBtn.addEventListener('click', () => {
    if (validStep(current)) go(current + 1, 'next');
  });
  prevBtn.addEventListener('click', () => go(current - 1, 'back'));

  form.addEventListener('input', save);
  form.addEventListener('change', save);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (current < steps.length - 1) {
      if (validStep(current)) go(current + 1, 'next');
      return;
    }
    if (!validStep(current)) return;
    if (await ITS.submitForm(form)) ITS.store.del(KEY);
  });

  go(restore(), 'next', false);
})();
