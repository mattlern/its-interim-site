/* ITS Intérim — comportements communs à toutes les pages */
(() => {
  'use strict';

  const ITS = (window.ITS = window.ITS || {});

  /* Adresse du service qui recevra les formulaires (Formspree, Web3Forms…).
     Tant qu'elle est vide, les formulaires fonctionnent en mode démonstration. */
  ITS.FORM_ENDPOINT = '';
  ITS.PHONE = '04 78 77 68 77';
  ITS.TEL = '+33478776877';

  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  ITS.reduceMotion = reduceMotion;

  /* ---------- Utilitaires ---------- */
  ITS.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  ITS.norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  ITS.store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* stockage indisponible */ } },
  };

  const ICONS = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  };
  ITS.icon = (name, cls = '') =>
    `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  ITS.toast = (msg) => {
    let t = $('[data-toast]');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      t.dataset.toast = '';
      document.body.append(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('is-on'));
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('is-on'), 2600);
  };

  /* ---------- Offres : chargement et carte ---------- */
  const FAMILLE_RULES = [
    ['Étanchéité', /etanch/],
    ['Plaquisterie', /plaqu|platr/],
    ['Agencement', /agenc|cuisin|ebenist|stand/],
    ['Charpente-couverture', /charpent|couvr|zingu|ossature|bardeu/],
    ['Menuiserie', /menuis|parquet|toupill|fenetre/],
  ];
  ITS.FAMILLES = ['Menuiserie', 'Agencement', 'Charpente-couverture', 'Plaquisterie', 'Étanchéité', 'Autres métiers'];

  const guessFamille = (titre) => {
    const t = ITS.norm(titre);
    for (const [f, re] of FAMILLE_RULES) if (re.test(t)) return f;
    return 'Autres métiers';
  };
  const list = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);

  ITS.normalizeOffre = (o, i) => {
    const ref = String(o.ref || o.id || `offre-${i + 1}`).trim();
    const titre = String(o.titre || 'Offre de mission').trim();
    return {
      ref,
      slug: ITS.norm(ref).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `offre-${i + 1}`,
      titre,
      lieu: String(o.lieu || '').trim(),
      debut: String(o.date || o.debut || '').trim(),
      contrat: String(o.contrat || '').trim(),
      duree: String(o.duree || '').trim(),
      salaire: String(o.salaire || '').trim(),
      horaires: String(o.horaires || '').trim(),
      description: String(o.description || '').trim(),
      missions: list(o.missions),
      profil: list(o.profil),
      famille: ITS.FAMILLES.includes(o.famille) ? o.famille : guessFamille(titre),
    };
  };

  let offresPromise = null;
  ITS.loadOffres = () => {
    offresPromise ||= fetch('offres.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => (Array.isArray(data) ? data : data.offres || []).map(ITS.normalizeOffre).reverse());
    return offresPromise;
  };

  const cut = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n) > 0 ? s.lastIndexOf(' ', n) : n) + '…' : s);

  ITS.offerCard = (o) => {
    const e = ITS.esc;
    const meta = [
      o.lieu && `<li>${ITS.icon('pin')}${e(o.lieu)}</li>`,
      o.debut && `<li>${ITS.icon('clock')}${e(o.debut)}</li>`,
      o.contrat && `<li>${ITS.icon('doc')}${e(o.contrat)}</li>`,
    ].filter(Boolean).join('');
    return `<article class="offer" data-slug="${e(o.slug)}">
  <div class="offer__top"><span class="badge">${e(o.famille)}</span><span class="offer__ref">Réf. ${e(o.ref.toUpperCase())}</span></div>
  <h3 class="offer__title"><a class="offer__link" href="offres.html#${e(o.slug)}" data-offre="${e(o.slug)}">${e(o.titre)}</a></h3>
  <ul class="offer__meta">${meta}</ul>
  <p class="offer__desc">${e(cut(o.description, 150))}</p>
  <div class="offer__foot"><span class="offer__more">Voir l'offre ${ITS.icon('arrow')}</span>${o.salaire ? `<span class="offer__ref">${e(o.salaire)}</span>` : ''}</div>
</article>`;
  };

  /* ---------- En-tête ---------- */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-compact', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const behindMenu = () => [$('#contenu'), $('.site-footer'), $('#actionbar')].filter(Boolean);
  const setMenu = (open) => {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    behindMenu().forEach((el) => { el.inert = open; });
    doc.classList.toggle('menu-open', open);
    if (open) setTimeout(() => menu.querySelector('a')?.focus({ preventScroll: true }), 250);
  };
  burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });
  matchMedia('(min-width: 1081px)').addEventListener('change', (e) => e.matches && setMenu(false));
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    setMenu(false);
    $('.vt-dia')?.style.removeProperty('view-transition-name');
  });

  /* Transition entre pages : le losange ne glisse que s'il est visible */
  addEventListener('pageswap', (e) => {
    if (!e.viewTransition) return;
    const d = $('.vt-dia');
    if (!d) return;
    const r = d.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) d.style.viewTransitionName = 'none';
  });

  /* ---------- Apparitions au défilement ---------- */
  $$('[data-stagger]').forEach((p) => [...p.children].forEach((c, i) => c.style.setProperty('--d', i)));
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Chiffres ---------- */
  const year = new Date().getFullYear();
  $$('[data-year]').forEach((el) => { el.textContent = year; });
  $$('[data-since]').forEach((el) => {
    el.textContent = year - Number(el.dataset.since);
    el.dataset.count = el.textContent;
  });
  const countUp = (el) => {
    const to = Number(el.dataset.count);
    if (!Number.isFinite(to) || reduceMotion) return;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countUp(en.target);
      cio.unobserve(en.target);
    }), { threshold: .6 });
    $$('[data-count]').forEach((el) => cio.observe(el));
  }

  /* ---------- Nombre d'offres et dernières offres ---------- */
  const countEls = $$('[data-offres-count]');
  const latest = $('[data-latest]');
  if (countEls.length || latest) {
    ITS.loadOffres()
      .then((offres) => {
        countEls.forEach((el) => { el.textContent = offres.length; });
        if (!latest) return;
        const n = Number(latest.dataset.latest) || 3;
        latest.innerHTML = offres.length
          ? offres.slice(0, n).map(ITS.offerCard).join('')
          : `<p class="muted">Aucune offre en ligne pour le moment. <a class="link" href="postuler.html">Déposez une candidature</a>, on vous appelle dès qu'une mission arrive.</p>`;
      })
      .catch(() => {
        if (latest) latest.innerHTML = `<p class="muted">Les offres n'ont pas pu se charger. Appelez l'agence au <a class="link" href="tel:${ITS.TEL}">${ITS.PHONE}</a>.</p>`;
      });
  }

  /* ---------- Barre d'action mobile ---------- */
  const bar = $('#actionbar');
  const footer = $('.site-footer');
  if (bar && footer) {
    let footerSeen = false;
    const update = () => bar.classList.toggle('is-visible', scrollY > 360 && !footerSeen && !doc.classList.contains('menu-open'));
    new IntersectionObserver(([en]) => { footerSeen = en.isIntersecting; update(); }).observe(footer);
    addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Sous-navigation des métiers ---------- */
  const subnav = $('.subnav__in');
  if (subnav && 'IntersectionObserver' in window) {
    const links = $$('a', subnav);
    const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const sio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const a = byId.get(en.target.id);
      if (!a) return;
      links.forEach((l) => l.classList.toggle('is-active', l === a));
      subnav.scrollTo({ left: a.offsetLeft - (subnav.clientWidth - a.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* ---------- Formulaires ---------- */
  const PHONE_RE = /^(?:(?:\+|00)33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

  const fieldOf = (el) => el.closest('[data-field]') || el.closest('.field') || el.parentElement;

  ITS.setError = (container, msg) => {
    if (!container) return;
    let err = container.querySelector(':scope > .field__error');
    const inputs = $$('input, select, textarea', container);
    if (!msg) {
      container.classList.remove('is-invalid');
      err?.remove();
      inputs.forEach((i) => i.removeAttribute('aria-invalid'));
      return;
    }
    if (!err) {
      err = document.createElement('p');
      err.className = 'field__error';
      err.id = `err-${Math.random().toString(36).slice(2, 8)}`;
      container.append(err);
    }
    err.textContent = msg;
    container.classList.add('is-invalid');
    inputs.forEach((i) => {
      i.setAttribute('aria-invalid', 'true');
      i.setAttribute('aria-describedby', err.id);
    });
  };

  const messageFor = (el) => {
    const v = el.value.trim();
    if (el.type === 'checkbox') return el.required && !el.checked ? 'Merci de cocher cette case pour continuer.' : '';
    if (el.required && !v) return 'Ce champ est obligatoire.';
    if (v && el.hasAttribute('data-phone') && !PHONE_RE.test(v)) return 'Ce numéro ne semble pas valide. Exemple : 06 12 34 56 78.';
    if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Cette adresse e-mail ne semble pas valide.';
    return '';
  };

  ITS.validate = (scope) => {
    let first = null;
    $$('input, select, textarea', scope).forEach((el) => {
      if (el.closest('[hidden]') || el.type === 'hidden' || el.type === 'radio' || (el.type === 'checkbox' && !el.required)) return;
      const msg = messageFor(el);
      ITS.setError(fieldOf(el), msg);
      if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  };

  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches('input, select, textarea')) return;
    if (el.hasAttribute('data-phone')) {
      const digits = el.value.replace(/\D/g, '');
      if (/^0\d{9}$/.test(digits)) el.value = digits.replace(/(\d{2})(?=\d)/g, '$1 ');
    }
    if (fieldOf(el)?.classList.contains('is-invalid')) ITS.setError(fieldOf(el), messageFor(el));
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.matches?.('input[type="checkbox"], input[type="radio"]')) {
      const box = el.closest('[data-field]') || el.closest('.field');
      if (box?.classList.contains('is-invalid') && (el.type !== 'checkbox' || !el.required || el.checked)) ITS.setError(box, '');
    }
    if (el.matches?.('[data-file] input[type="file"]')) {
      const label = el.closest('[data-file]');
      const name = label.querySelector('[data-file-name]');
      const f = el.files?.[0];
      if (f && f.size > 8 * 1024 * 1024) {
        el.value = '';
        name.textContent = 'Fichier trop lourd (8 Mo maximum)';
        return;
      }
      name.textContent = f ? f.name : 'Ajouter un fichier ou une photo';
    }
  });
  ['dragenter', 'dragover'].forEach((t) => document.addEventListener(t, (e) => e.target.closest?.('[data-file]')?.classList.add('is-drag')));
  ['dragleave', 'drop'].forEach((t) => document.addEventListener(t, (e) => e.target.closest?.('[data-file]')?.classList.remove('is-drag')));

  const DONE = {
    candidature: ['Candidature envoyée', 'Merci ! Un chargé d\'affaires vous appelle pour faire le point avec vous.'],
    offre: ['Candidature envoyée', 'Merci ! On revient vers vous très vite au sujet de cette offre.'],
    entreprise: ['Demande envoyée', 'Merci. Un chargé d\'affaires vous rappelle pour préciser votre besoin.'],
    contact: ['Message envoyé', 'Merci, on vous répond rapidement.'],
  };

  const showDone = (form) => {
    const [title, text] = DONE[form.dataset.form] || DONE.contact;
    const box = document.createElement('div');
    box.className = 'done';
    box.tabIndex = -1;
    box.setAttribute('role', 'status');
    box.innerHTML = `<span class="done__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
<p class="h3">${title}</p><p>${text}</p>
${ITS.FORM_ENDPOINT ? '' : '<p class="form-note">Version de démonstration : le formulaire sera relié à la boîte mail d\'ITS à la mise en ligne.</p>'}
<a class="btn btn--outline btn--sm" href="offres.html">Voir les offres</a>`;
    form.replaceWith(box);
    box.focus({ preventScroll: true });
    box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  };

  ITS.submitForm = async (form) => {
    const btn = form.querySelector('button[type="submit"]:not([hidden])') || form.querySelector('button[type="submit"]');
    const status = form.querySelector('[data-status]');
    btn?.classList.add('is-loading');
    if (btn) btn.disabled = true;
    if (status) { status.textContent = 'Envoi en cours…'; status.classList.remove('is-error'); }
    const data = new FormData(form);
    data.append('formulaire', form.dataset.form);
    data.append('page', location.pathname);
    try {
      if (ITS.FORM_ENDPOINT) {
        const r = await fetch(ITS.FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else {
        await new Promise((res) => setTimeout(res, 900));
        console.info('[ITS] Mode démonstration, rien n\'a été envoyé :', Object.fromEntries(data));
      }
      showDone(form);
      return true;
    } catch {
      if (status) {
        status.textContent = `L'envoi n'a pas abouti. Réessayez, ou appelez l'agence au ${ITS.PHONE}.`;
        status.classList.add('is-error');
      }
      return false;
    } finally {
      btn?.classList.remove('is-loading');
      if (btn) btn.disabled = false;
    }
  };

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form || form.hasAttribute('data-wizard')) return;
    e.preventDefault();
    if (ITS.validate(form)) ITS.submitForm(form);
  });

  /* Compteur +/- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-stepper] [data-step]');
    if (!b) return;
    const input = b.closest('[data-stepper]').querySelector('input');
    const v = Math.min(Number(input.max) || 99, Math.max(Number(input.min) || 1, (Number(input.value) || 1) + Number(b.dataset.step)));
    input.value = v;
  });

  /* Boutons copier */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      ITS.toast('Copié');
    } catch {
      ITS.toast(b.dataset.copy);
    }
  });
})();
