/* ITS Intérim — page des offres : filtres, liste, détail d'une offre */
(() => {
  'use strict';
  const ITS = window.ITS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const e = ITS.esc;
  const doc = document.documentElement;

  const listEl = $('[data-list]');
  const chipsEl = $('[data-chips]');
  const filtersForm = $('[data-filters]');
  const qInput = $('#f-q');
  const lieuSelect = $('#f-lieu');
  const countEl = $('[data-results-count]');
  const resetBtns = $$('[data-reset]');
  const emptyEl = $('[data-empty]');
  const errorEl = $('[data-error]');
  const dialog = $('#offre');
  const dBody = $('[data-od-body]');
  const dBadge = $('[data-od-badge]');
  const baseTitle = document.title;

  const params = new URLSearchParams(location.search);
  const state = { famille: params.get('famille') || '', lieu: params.get('lieu') || '', q: params.get('q') || '' };
  qInput.value = state.q;

  let all = [];
  let ready = false;
  let lastFocus = null;

  const words = () => ITS.norm(state.q).split(/\s+/).filter(Boolean);
  const matchQ = (o) => {
    const w = words();
    if (!w.length) return true;
    const hay = ITS.norm([o.titre, o.lieu, o.famille, o.ref, o.description, o.contrat, ...o.missions, ...o.profil].join(' '));
    return w.every((x) => hay.includes(x));
  };
  const matchLieu = (o) => !state.lieu || o.lieu === state.lieu;
  const matches = (o) => (!state.famille || o.famille === state.famille) && matchLieu(o) && matchQ(o);
  const isFiltered = () => Boolean(state.famille || state.lieu || state.q.trim());

  /* ---------- Filtres ---------- */
  const buildFilters = () => {
    const lieux = [...new Set(all.map((o) => o.lieu).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    lieuSelect.insertAdjacentHTML('beforeend', lieux.map((l) => `<option value="${e(l)}">${e(l)}</option>`).join(''));
    if (state.lieu && !lieux.includes(state.lieu)) state.lieu = '';
    lieuSelect.value = state.lieu;

    const familles = ITS.FAMILLES.filter((f) => all.some((o) => o.famille === f));
    if (state.famille && !familles.includes(state.famille)) state.famille = '';
    chipsEl.innerHTML = [['', 'Toutes']].concat(familles.map((f) => [f, f]))
      .map(([v, label]) => `<button class="chip" type="button" data-famille="${e(v)}" aria-pressed="false">${e(label)} <span class="chip__count">0</span></button>`)
      .join('');
  };

  const updateChips = () => {
    const base = all.filter((o) => matchLieu(o) && matchQ(o));
    $$('[data-famille]', chipsEl).forEach((b) => {
      const v = b.dataset.famille;
      b.setAttribute('aria-pressed', String(state.famille === v));
      b.querySelector('.chip__count').textContent = v ? base.filter((o) => o.famille === v).length : base.length;
    });
  };

  const syncURL = () => {
    const p = new URLSearchParams();
    if (state.famille) p.set('famille', state.famille);
    if (state.lieu) p.set('lieu', state.lieu);
    if (state.q.trim()) p.set('q', state.q.trim());
    const qs = p.toString();
    history.replaceState(history.state, '', `${location.pathname}${qs ? '?' + qs : ''}${location.hash}`);
  };

  /* ---------- Liste ---------- */
  const nameCards = (on) => $$('.offer', listEl).forEach((c) => {
    c.style.viewTransitionName = on ? `offre-${c.dataset.slug}` : '';
  });

  const paint = () => {
    const res = all.filter(matches);
    listEl.innerHTML = res.map(ITS.offerCard).join('');
    listEl.hidden = !res.length;
    emptyEl.hidden = Boolean(res.length);
    const n = res.length;
    countEl.textContent = !n ? 'Aucune offre' : isFiltered()
      ? `${n} offre${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''}`
      : `${n} offre${n > 1 ? 's' : ''} disponible${n > 1 ? 's' : ''}`;
    resetBtns[0].hidden = !isFiltered();
    updateChips();
  };

  const render = () => {
    syncURL();
    if (!ready || ITS.reduceMotion || !document.startViewTransition) {
      paint();
      return;
    }
    nameCards(true);
    doc.classList.add('vt-list');
    const t = document.startViewTransition(() => {
      paint();
      nameCards(true);
    });
    t.finished.finally(() => {
      doc.classList.remove('vt-list');
      nameCards(false);
    });
  };

  chipsEl.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-famille]');
    if (!b) return;
    state.famille = b.dataset.famille;
    render();
  });
  lieuSelect.addEventListener('change', () => { state.lieu = lieuSelect.value; render(); });
  let qTimer;
  qInput.addEventListener('input', () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = qInput.value; render(); }, 200);
  });
  filtersForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    state.q = qInput.value;
    render();
    qInput.blur();
  });
  resetBtns.forEach((b) => b.addEventListener('click', () => {
    Object.assign(state, { famille: '', lieu: '', q: '' });
    qInput.value = '';
    lieuSelect.value = '';
    render();
  }));

  /* ---------- Détail d'une offre ---------- */
  const fact = (label, value) => (value ? `<div class="fact"><dt>${label}</dt><dd>${e(value)}</dd></div>` : '');
  const paras = (txt) => txt.split(/\n{2,}|\n/).filter(Boolean).map((p) => `<p>${e(p)}</p>`).join('');
  const bullets = (title, items) => (items.length
    ? `<div class="od__section"><h3 class="h4">${title}</h3><ul class="list-dia">${items.map((x) => `<li>${e(x)}</li>`).join('')}</ul></div>`
    : '');

  const detail = (o) => `
<div class="od__intro">
  <p class="offer__ref">Réf. ${e(o.ref.toUpperCase())}</p>
  <h2 class="od__title" id="od-title" tabindex="-1">${e(o.titre)}</h2>
</div>
<dl class="facts">${fact('Lieu', o.lieu)}${fact('Début', o.debut)}${fact('Contrat', o.contrat)}${fact('Durée', o.duree)}${fact('Salaire', o.salaire)}${fact('Horaires', o.horaires)}</dl>
${o.description ? `<div class="od__section"><h3 class="h4">Le poste</h3>${paras(o.description)}</div>` : ''}
${bullets('Vos missions', o.missions)}
${bullets('Votre profil', o.profil)}
<form class="apply-box form" data-form="offre" novalidate>
  <p class="h3">Postuler à cette offre</p>
  <input type="hidden" name="offre" value="${e(o.ref.toUpperCase())} · ${e(o.titre)}">
  <div class="form__row">
    <div class="field"><label class="label" for="od-prenom">Prénom <span class="req">*</span></label><input class="input" id="od-prenom" name="prenom" type="text" autocomplete="given-name" required></div>
    <div class="field"><label class="label" for="od-nom">Nom <span class="req">*</span></label><input class="input" id="od-nom" name="nom" type="text" autocomplete="family-name" required></div>
  </div>
  <div class="field"><label class="label" for="od-tel">Téléphone <span class="req">*</span></label><input class="input" id="od-tel" name="telephone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78" required data-phone></div>
  <div class="field"><label class="label" for="od-email">E-mail <span class="opt">(facultatif)</span></label><input class="input" id="od-email" name="email" type="email" autocomplete="email"></div>
  <div class="field">
    <span class="label">Votre CV <span class="opt">(facultatif)</span></span>
    <label class="file" data-file>
      <input type="file" name="cv" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic">
      <span class="file__icon">${ITS.icon('upload')}</span>
      <span class="file__txt"><span class="file__name" data-file-name>Ajouter un fichier ou une photo</span><span class="hint">Pas de CV ? Envoyez sans, on vous appelle.</span></span>
    </label>
  </div>
  <div class="field"><label class="check"><input type="checkbox" name="consentement" required><span>J'accepte qu'ITS Intérim utilise ces informations pour traiter ma candidature. <a class="link" href="mentions-legales.html#confidentialite">En savoir plus</a></span></label></div>
  <button class="btn btn--primary btn--block" type="submit"><span class="btn__label">Envoyer ma candidature</span>${ITS.icon('arrow', 'i-arrow')}</button>
  <p class="form-status" data-status aria-live="polite"></p>
</form>
<p class="call-line">Une question sur cette offre ? <a href="tel:${ITS.TEL}">${ITS.PHONE}</a><span>avec la référence ${e(o.ref.toUpperCase())}</span></p>`;

  const show = (slug) => {
    const o = all.find((x) => x.slug === slug);
    if (!o) return false;
    dBadge.textContent = o.famille;
    dBody.innerHTML = detail(o);
    dBody.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    document.title = `${o.titre} · ${baseTitle}`;
    requestAnimationFrame(() => $('#od-title', dBody)?.focus({ preventScroll: true }));
    return true;
  };

  const hide = () => {
    if (dialog.open) dialog.close();
    document.title = baseTitle;
    lastFocus?.focus?.({ preventScroll: true });
  };

  const close = () => {
    if (history.state?.offre) history.back();
    else {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      hide();
    }
  };

  document.addEventListener('click', (ev) => {
    const link = ev.target.closest('a[data-offre]');
    if (!link || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    ev.preventDefault();
    lastFocus = link;
    const slug = link.dataset.offre;
    if (show(slug)) history.pushState({ offre: slug }, '', `${location.pathname}${location.search}#${slug}`);
  });

  $('[data-close]', dialog).addEventListener('click', close);
  $('[data-goto-form]', dialog).addEventListener('click', () => {
    const target = $('form[data-form]', dBody) || $('.done', dBody);
    if (!target) return;
    target.scrollIntoView({ behavior: ITS.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    $('input:not([type="hidden"])', target)?.focus({ preventScroll: true });
  });
  dialog.addEventListener('cancel', (ev) => { ev.preventDefault(); close(); });
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) close(); });
  $('[data-copy-link]', dialog).addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      ITS.toast('Lien de l\'offre copié');
    } catch {
      ITS.toast(location.href);
    }
  });

  addEventListener('popstate', () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (slug && show(slug)) return;
    hide();
  });

  /* ---------- Chargement ---------- */
  ITS.loadOffres()
    .then((offres) => {
      all = offres;
      buildFilters();
      paint();
      ready = true;
      const slug = decodeURIComponent(location.hash.slice(1));
      if (slug) show(slug);
    })
    .catch(() => {
      listEl.hidden = true;
      errorEl.hidden = false;
      countEl.textContent = 'Offres indisponibles';
    });
})();
