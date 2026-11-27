/*
  Catalogue à grande échelle (ADR 0004) : facettes Famille / Type / Secteur / Options, recherche, tri,
  filtres actifs retirables, pagination « Afficher plus ». État dans l'URL (partageable, non indexé) :
  ?c=<famille>&type=a,b&secteur=x,y&q=…&tri=az&reglables=1&animees=1
  En production : page prérendue par catégorie, type et secteur ; les combinaisons filtrent côté client.
  Motion niveau 2 : cascade au premier affichage, Flip à chaque filtrage.
  États de maquette : ?etat=chargement (squelette 1,5 s) ou ?etat=erreur.
*/
(function () {
  var NGS = window.NGS;
  var PAGE = 24;
  var params = new URLSearchParams(location.search);
  var liste = function (k) { return (params.get(k) || '').split(',').filter(Boolean); };
  var etat = {
    famille: params.get('c') || 'tout',
    types: liste('type'),
    secteurs: liste('secteur'),
    q: params.get('q') || '',
    tri: params.get('tri') || 'recent',
    reglables: params.get('reglables') === '1',
    animees: params.get('animees') === '1',
    visibles: PAGE
  };
  var typesOuverts = false;
  var grille, compte, zoneEtat, facettes, actifs, champ;

  /* ---------- Filtrage et facettes ---------- */
  function correspond(r, sauf) {
    if (sauf !== 'famille' && etat.famille !== 'tout' && r.famille !== etat.famille) return false;
    if (sauf !== 'type' && etat.types.length && etat.types.indexOf(r.type) < 0) return false;
    if (sauf !== 'secteur' && etat.secteurs.length && !r.secteurs.some(function (s) { return etat.secteurs.indexOf(s) >= 0; })) return false;
    if (etat.reglables && !r.reglable) return false;
    if (etat.animees && !r.motion) return false;
    return true;
  }
  function base() { return NGS.chercher(etat.q); }
  function resultats() {
    var l = base().filter(function (r) { return correspond(r); });
    if (etat.tri === 'az') l.sort(function (a, b) { return a.titre.localeCompare(b.titre, 'fr'); });
    else l.sort(function (a, b) { return b.ajout.localeCompare(a.ajout) || NGS.registre.indexOf(a) - NGS.registre.indexOf(b); });
    return l;
  }
  function compteSans(axe) {
    var c = {};
    base().filter(function (r) { return correspond(r, axe); }).forEach(function (r) {
      if (axe === 'famille') c[r.famille] = (c[r.famille] || 0) + 1;
      if (axe === 'type' && r.type) c[r.type] = (c[r.type] || 0) + 1;
      if (axe === 'secteur') r.secteurs.forEach(function (s) { c[s] = (c[s] || 0) + 1; });
    });
    return c;
  }

  function option(type, nom, valeur, coche, libelle, n, icone, classe) {
    return '<label class="ngs-option ' + (n ? '' : 'is-vide ') + (classe || '') + '"><input type="' + type + '" name="' + nom + '" value="' + valeur + '"' + (coche ? ' checked' : '') + '>' +
      (icone || '') + '<span>' + libelle + '</span><span class="ngs-option__compte">' + n + '</span></label>';
  }
  function facette(id, titre, corps, ouverte) {
    return '<details class="ngs-facette" data-facette="' + id + '"' + (ouverte ? ' open' : '') + '><summary><span>' + titre + '</span>' + NGS.icone('caret-down') + '</summary><div class="ngs-facette__corps">' + corps + '</div></details>';
  }
  function rendreFacettes() {
    var ouvertes = {};
    facettes.querySelectorAll('[data-facette]').forEach(function (d) { ouvertes[d.dataset.facette] = d.open; });
    var def = function (id) { return ouvertes[id] === undefined ? true : ouvertes[id]; };
    var nf = compteSans('famille'), nt = compteSans('type'), ns = compteSans('secteur');
    var total = Object.keys(nf).reduce(function (s, k) { return s + nf[k]; }, 0);

    var fam = option('radio', 'famille', 'tout', etat.famille === 'tout', NGS.t('catalogue.tout'), total) +
      NGS.familles.map(function (f) {
        return option('radio', 'famille', f.id, etat.famille === f.id, NGS.t('cat.' + f.id), nf[f.id] || 0, '<span class="ngs-chip__dot" aria-hidden="true"></span>', 'ngs-cat-' + f.id);
      }).join('');

    var types = NGS.types.filter(function (t) { return etat.famille === 'tout' || t.famille === etat.famille; })
      .sort(function (a, b) { return (nt[b.id] || 0) - (nt[a.id] || 0) || NGS.libelleType(a.id).localeCompare(NGS.libelleType(b.id), 'fr'); });
    var montres = types.filter(function (t, i) { return typesOuverts || i < 8 || etat.types.indexOf(t.id) >= 0; });
    var reste = types.length - montres.length;
    var typ = montres.map(function (t) {
      return option('checkbox', 'type', t.id, etat.types.indexOf(t.id) >= 0, NGS.libelleType(t.id), nt[t.id] || 0, '', 'ngs-cat-' + t.famille);
    }).join('') + (types.length > 8 ? '<button class="ngs-link ngs-link--rest justify-self-start mt-2 text-sm border-0 bg-transparent cursor-pointer p-0" type="button" data-types-plus>' +
      (typesOuverts ? NGS.t('catalogue.types.moins') : NGS.t('catalogue.types.plus', { n: reste })) + '</button>' : '');

    var sec = '<p class="ngs-small ngs-muted m-0 mb-2">' + NGS.t('notion.secteur.aide') + '</p>' + NGS.secteurs.map(function (s) {
      return option('checkbox', 'secteur', s.id, etat.secteurs.indexOf(s.id) >= 0, NGS.libelleSecteur(s.id), ns[s.id] || 0, NGS.icone(s.icone, 'ngs-icon--sm'));
    }).join('');

    var opt = '<label class="ngs-switch"><input type="checkbox" data-reglables' + (etat.reglables ? ' checked' : '') + '><span class="ngs-switch__track" aria-hidden="true"></span><span>' + NGS.t('catalogue.reglables') + '</span></label>' +
      '<label class="ngs-switch"><input type="checkbox" data-animees' + (etat.animees ? ' checked' : '') + '><span class="ngs-switch__track" aria-hidden="true"></span><span>' + NGS.t('catalogue.animees') + '</span></label>';

    facettes.innerHTML = facette('famille', NGS.t('catalogue.facette.famille'), fam, def('famille')) +
      (etat.famille === 'designs' ? '' : facette('type', NGS.t('catalogue.facette.type'), typ, def('type'))) +
      facette('secteur', NGS.t('catalogue.facette.secteur'), sec, def('secteur')) +
      facette('options', NGS.t('catalogue.facette.options'), opt, def('options'));
  }

  function rendreActifs() {
    var puces = [];
    function puce(axe, valeur, libelle) {
      puces.push('<button class="ngs-filtre-actif" type="button" data-retirer="' + axe + '" data-valeur="' + valeur + '" aria-label="' + NGS.t('catalogue.filtre.retirer', { f: libelle }) + '">' + libelle + NGS.icone('x') + '</button>');
    }
    if (etat.famille !== 'tout') puce('famille', etat.famille, NGS.t('cat.' + etat.famille));
    etat.types.forEach(function (t) { puce('type', t, NGS.libelleType(t)); });
    etat.secteurs.forEach(function (s) { puce('secteur', s, NGS.libelleSecteur(s)); });
    if (etat.reglables) puce('reglables', '1', NGS.t('catalogue.reglables'));
    if (etat.animees) puce('animees', '1', NGS.t('catalogue.animees'));
    if (etat.q) puce('q', '', '« ' + etat.q + ' »');
    actifs.innerHTML = puces.join('') + (puces.length > 1 ? '<button class="ngs-link ngs-link--rest text-sm border-0 bg-transparent cursor-pointer" type="button" data-effacer-tout>' + NGS.t('catalogue.filtres.effacer') + '</button>' : '');
    actifs.hidden = !puces.length;
    var nb = puces.length;
    document.querySelector('[data-nb-filtres]').textContent = nb ? '(' + nb + ')' : '';
  }

  function majTitre() {
    var h1 = document.querySelector('[data-titre-catalogue]');
    if (etat.types.length === 1 && !etat.secteurs.length) h1.textContent = NGS.libelleType(etat.types[0]) + ' Angular';
    else if (etat.secteurs.length === 1 && etat.famille === 'tout' && !etat.types.length) h1.textContent = NGS.t('notion.secteur') + ' : ' + NGS.libelleSecteur(etat.secteurs[0]);
    else h1.textContent = NGS.t(etat.famille === 'tout' ? 'catalogue.h1' : 'catalogue.h1.' + etat.famille);
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === etat.famille) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function majUrl() {
    var p = new URLSearchParams();
    if (etat.famille !== 'tout') p.set('c', etat.famille);
    if (etat.types.length) p.set('type', etat.types.join(','));
    if (etat.secteurs.length) p.set('secteur', etat.secteurs.join(','));
    if (etat.q) p.set('q', etat.q);
    if (etat.tri !== 'recent') p.set('tri', etat.tri);
    if (etat.reglables) p.set('reglables', '1');
    if (etat.animees) p.set('animees', '1');
    var qs = p.toString();
    // Seuls les paramètres changent : pas de navigation, donc pas de transition de page (ADR 0005).
    history.replaceState(null, '', 'catalogue.html' + (qs ? '?' + qs : ''));
  }

  function etatVide(type) {
    if (type === 'templates') {
      return '<div class="ngs-state"><span class="ngs-state__icon">' + NGS.icone('browser', 'ngs-icon--lg') + '</span>' +
        '<h2 class="ngs-state__title">' + NGS.t('catalogue.templates.titre') + '</h2><p class="m-0 ngs-muted max-w-[46ch]">' + NGS.t('catalogue.templates.texte') + '</p>' +
        '<a class="ngs-btn" href="index.html#contribuer">' + NGS.t('catalogue.templates.cta') + '</a></div>';
    }
    if (type === 'erreur') {
      return '<div class="ngs-state ngs-state--error" role="alert"><span class="ngs-state__icon">' + NGS.icone('warning-circle', 'ngs-icon--lg') + '</span>' +
        '<h2 class="ngs-state__title">' + NGS.t('catalogue.erreur.titre') + '</h2><p class="m-0 ngs-muted">' + NGS.t('catalogue.erreur.texte') + '</p>' +
        '<button class="ngs-btn" type="button" data-reessayer>' + NGS.icone('arrow-clockwise') + '<span>' + NGS.t('catalogue.erreur.cta') + '</span></button></div>';
    }
    var q = (etat.q || etat.types.map(NGS.libelleType).concat(etat.secteurs.map(NGS.libelleSecteur)).join(', ')).replace(/</g, '&lt;');
    return '<div class="ngs-state"><span class="ngs-state__icon">' + NGS.icone('magnifying-glass', 'ngs-icon--lg') + '</span>' +
      '<h2 class="ngs-state__title">' + NGS.t('catalogue.vide.titre', { q: q }) + '</h2><p class="m-0 ngs-muted">' + NGS.t('catalogue.vide.texte') + '</p>' +
      '<button class="ngs-btn ngs-btn--secondary" type="button" data-effacer-tout>' + NGS.t('catalogue.filtres.effacer') + '</button></div>';
  }

  function squelette() {
    grille.innerHTML = Array.from({ length: 6 }).map(function () {
      return '<div class="ngs-case" aria-hidden="true"><div class="ngs-case__stage"><div class="ngs-skeleton w-3/4 h-24"></div></div>' +
        '<div class="ngs-case__foot"><div class="grid gap-2 w-full"><div class="ngs-skeleton h-4 w-1/2"></div><div class="ngs-skeleton h-5 w-1/3"></div></div></div></div>';
    }).join('');
    compte.textContent = NGS.t('catalogue.chargement');
  }

  var premier = true;
  function rendre() {
    var tout = resultats();
    var l = tout.slice(0, etat.visibles);
    var anciens = {};
    grille.querySelectorAll('.ngs-case[data-slug]').forEach(function (c) { anciens[c.dataset.slug] = c; });
    var avecFlip = !premier && window.Flip && !NGS.motion.reduit;
    var etatFlip = avecFlip ? Flip.getState(grille.querySelectorAll('.ngs-case')) : null;

    var fragment = document.createDocumentFragment();
    l.forEach(function (r) {
      var c = anciens[r.slug];
      if (!c) {
        var t = document.createElement('template');
        t.innerHTML = NGS.caseHTML(r);
        c = t.content.firstElementChild;
        var sd = c.querySelector('[data-design]');
        NGS.habiller(sd || c, sd ? sd.dataset.design : 'planche');
      }
      fragment.appendChild(c);
    });
    grille.innerHTML = '';
    grille.appendChild(fragment);
    grille.setAttribute('aria-busy', 'false');

    compte.textContent = tout.length > l.length ? NGS.t('catalogue.page', { n: l.length, total: NGS.pluriel(tout.length) }) : NGS.pluriel(tout.length);
    document.querySelector('[data-plus-zone]').hidden = tout.length <= l.length;
    var tc = document.querySelector('[data-tiroir-compte]');
    if (tc) tc.textContent = '(' + tout.length + ')';
    zoneEtat.innerHTML = '';
    if (!tout.length) {
      var seulTemplates = etat.famille === 'templates' && !etat.q && !etat.types.length && !etat.secteurs.length;
      zoneEtat.innerHTML = etatVide(seulTemplates ? 'templates' : 'vide');
    }
    rendreFacettes();
    rendreActifs();
    majTitre();
    majUrl();

    // États finaux explicites + clearProps : aucune case ne garde de décalage ni d'échelle après l'animation
    // (en v0.2, un from() pendant une transition CSS laissait les cases à des hauteurs différentes).
    var nettoyer = 'transform,opacity,visibility';
    if (avecFlip) {
      var cases = grille.querySelectorAll('.ngs-case');
      Flip.from(etatFlip, {
        duration: 0.45, ease: 'power2.inOut', scale: true,
        onEnter: function (els) { return gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.35, delay: 0.1, clearProps: nettoyer }); },
        onComplete: function () { gsap.set(cases, { clearProps: nettoyer }); }
      });
    } else if (premier && window.gsap && !NGS.motion.reduit) {
      gsap.set(grille.querySelectorAll('.ngs-case'), { y: 24, autoAlpha: 0 });
      ScrollTrigger.batch(grille.querySelectorAll('.ngs-case'), {
        start: 'top 95%', once: true,
        onEnter: function (els) { gsap.fromTo(els, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: 'expo.out', overwrite: true, clearProps: nettoyer }); }
      });
    }
    premier = false;
  }

  function effacerTout() {
    etat.famille = 'tout'; etat.types = []; etat.secteurs = []; etat.q = ''; etat.reglables = false; etat.animees = false; etat.visibles = PAGE;
    champ.value = '';
    rendre();
  }

  /* ---------- Tiroir (mobile) ---------- */
  function tiroir() {
    var t = document.querySelector('[data-tiroir]');
    var fond = document.querySelector('[data-tiroir-fond]');
    var btn = document.querySelector('[data-tiroir-ouvrir]');
    var mobile = matchMedia('(max-width: 63.99rem)');
    function ouvrir(o) {
      if (!mobile.matches) return;
      t.classList.toggle('is-open', o);
      fond.classList.toggle('is-open', o);
      btn.setAttribute('aria-expanded', String(o));
      if (o) { t.setAttribute('role', 'dialog'); t.setAttribute('aria-modal', 'true'); t.removeAttribute('inert'); t.querySelector('[data-tiroir-fermer]').focus(); }
      else { t.removeAttribute('role'); t.removeAttribute('aria-modal'); t.setAttribute('inert', ''); btn.focus(); }
      document.documentElement.style.overflow = o ? 'hidden' : '';
    }
    function maj() { if (mobile.matches) { if (!t.classList.contains('is-open')) t.setAttribute('inert', ''); } else { t.removeAttribute('inert'); t.classList.remove('is-open'); fond.classList.remove('is-open'); } }
    mobile.addEventListener('change', maj); maj();
    btn.addEventListener('click', function () { ouvrir(true); });
    fond.addEventListener('click', function () { ouvrir(false); });
    t.querySelector('[data-tiroir-fermer]').addEventListener('click', function () { ouvrir(false); });
    t.querySelector('[data-tiroir-voir]').addEventListener('click', function () { ouvrir(false); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Escape') ouvrir(false); });
  }

  NGS.pret.then(function () {
    grille = document.querySelector('[data-grille]');
    compte = document.querySelector('[data-compte]');
    zoneEtat = document.querySelector('[data-etat]');
    facettes = document.querySelector('[data-facettes]');
    actifs = document.querySelector('[data-actifs]');
    champ = document.getElementById('filtre');
    champ.value = etat.q;
    document.querySelector('[data-tri]').value = etat.tri;
    tiroir();

    facettes.addEventListener('change', function (e) {
      var i = e.target;
      if (i.name === 'famille') { etat.famille = i.value; etat.types = etat.types.filter(function (t) { return i.value === 'tout' || NGS.types.some(function (x) { return x.id === t && x.famille === i.value; }); }); }
      else if (i.name === 'type') etat.types = i.checked ? etat.types.concat(i.value) : etat.types.filter(function (t) { return t !== i.value; });
      else if (i.name === 'secteur') etat.secteurs = i.checked ? etat.secteurs.concat(i.value) : etat.secteurs.filter(function (t) { return t !== i.value; });
      else if (i.hasAttribute('data-reglables')) etat.reglables = i.checked;
      else if (i.hasAttribute('data-animees')) etat.animees = i.checked;
      etat.visibles = PAGE;
      var nom = i.name, val = i.value;
      rendre();
      var retour = (nom ? facettes.querySelector('input[name="' + nom + '"][value="' + val + '"]') : null) ||
        facettes.querySelector(i.hasAttribute('data-animees') ? '[data-animees]' : '[data-reglables]');
      if (retour) retour.focus();
    });
    facettes.addEventListener('click', function (e) {
      if (e.target.closest('[data-types-plus]')) { typesOuverts = !typesOuverts; rendreFacettes(); facettes.querySelector('[data-types-plus]').focus(); }
    });
    document.addEventListener('click', function (e) {
      var r = e.target.closest('[data-retirer]');
      if (r) {
        var a = r.dataset.retirer, v = r.dataset.valeur;
        if (a === 'famille') etat.famille = 'tout';
        if (a === 'type') etat.types = etat.types.filter(function (t) { return t !== v; });
        if (a === 'secteur') etat.secteurs = etat.secteurs.filter(function (t) { return t !== v; });
        if (a === 'reglables') etat.reglables = false;
        if (a === 'animees') etat.animees = false;
        if (a === 'q') { etat.q = ''; champ.value = ''; }
        rendre();
        champ.focus();
      }
      if (e.target.closest('[data-effacer-tout]')) effacerTout();
    });
    var minuteur;
    champ.addEventListener('input', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(function () { etat.q = champ.value; etat.visibles = PAGE; rendre(); }, 140);
    });
    document.querySelector('[data-tri]').addEventListener('change', function (e) { etat.tri = e.target.value; rendre(); });
    document.querySelector('[data-plus]').addEventListener('click', function () { etat.visibles += PAGE; rendre(); });

    var demo = new URLSearchParams(location.search).get('etat');
    if (demo === 'erreur') {
      grille.innerHTML = '';
      compte.textContent = '';
      rendreFacettes();
      zoneEtat.innerHTML = etatVide('erreur');
      zoneEtat.querySelector('[data-reessayer]').addEventListener('click', function (e) {
        e.currentTarget.classList.add('is-loading');
        squelette();
        zoneEtat.innerHTML = '';
        setTimeout(rendre, 900);
      });
    } else if (demo === 'chargement') {
      squelette();
      rendreFacettes();
      setTimeout(rendre, 1500);
    } else rendre();
  });
})();
