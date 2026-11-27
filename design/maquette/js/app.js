/*
  Coquille commune des pages de la maquette : textes, icônes, splash, header + méga-menu, menu mobile,
  recherche (⌘K), toasts, onglets, copie, cases de la planche, transitions de page (View Transitions
  + repli), pied de page (liens de Sidy, signature).
  En Angular : un composant par bloc (layout, splash, header, mega-menu, search-dialog, toast-region…).
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});
  var site = NGS.site;

  /* ---------- Textes ---------- */
  NGS.t = function (cle, params) {
    var s = NGS.textes[cle];
    if (s == null) { console.warn('[textes] clé absente :', cle); return cle; }
    params = Object.assign({ nom: site.nom }, NGS.paramsLegaux(), params || {});
    return s.replace(/\{(\w+)\}/g, function (_, k) { return params[k] != null ? params[k] : '{' + k + '}'; });
  };
  /* Valeurs des pages légales, lues dans config.js (jamais recopiées) ; hébergeur non choisi = champ « à compléter ». */
  var CHAMP = function (t) { return '<span class="ngs-acompleter">[à compléter par Sidy : ' + t + ']</span>'; };
  NGS.champ = CHAMP;
  NGS.paramsLegaux = function () {
    var h = site.hebergeur && site.hebergeurs[site.hebergeur];
    var lien = h ? '<a href="' + h.site + '" rel="noopener" target="_blank">' + h.site.replace(/^https:\/\/(www\.)?|\/$/g, '') + '</a>' : CHAMP('site de l’hébergeur');
    return {
      auteur: site.auteur.nomComplet || site.auteur.nom,
      email: site.auteur.email,
      hebergeur: h ? h.nom : CHAMP('hébergeur : Cloudflare ou Netlify'),
      hebergeurAdresse: h ? h.adresse : CHAMP('adresse de l’hébergeur'),
      hebergeurSite: lien
    };
  };
  NGS.pluriel = function (n) { return NGS.t(n > 1 ? 'pluriel.ressources' : 'pluriel.ressource', { n: n }); };
  NGS.appliquerTextes = function (racine) {
    racine = racine || document;
    racine.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = NGS.t(el.dataset.t); });
    racine.querySelectorAll('[data-t-html]').forEach(function (el) { el.innerHTML = NGS.t(el.dataset.tHtml); });
    racine.querySelectorAll('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', NGS.t(el.dataset.tAria)); });
    racine.querySelectorAll('[data-t-placeholder]').forEach(function (el) { el.setAttribute('placeholder', NGS.t(el.dataset.tPlaceholder)); });
    racine.querySelectorAll('[data-nom]').forEach(function (el) { el.textContent = site.nom; });
    racine.querySelectorAll('[data-nom-court]').forEach(function (el) { el.textContent = site.nomCourt; });
  };

  /* ---------- Icônes (Phosphor regular, sprite) ---------- */
  NGS.icone = function (nom, classe) {
    return '<svg class="ngs-icon ' + (classe || '') + '" aria-hidden="true" focusable="false"><use href="' + site.chemins.sprite + '#' + nom + '"></use></svg>';
  };

  /* ---------- Motion ---------- */
  var mqReduit = matchMedia('(prefers-reduced-motion: reduce)');
  NGS.motion = {
    get reduit() { return mqReduit.matches; },
    pointeurFin: matchMedia('(hover: hover) and (pointer: fine)').matches,
    // Transitions de document à document (View Transitions niveau 2) disponibles ?
    vtDocument: 'onpageswap' in window
  };
  if (window.gsap) {
    gsap.registerPlugin.apply(gsap, [window.ScrollTrigger, window.Flip, window.SplitText].filter(Boolean));
    gsap.defaults({ ease: 'power2.out', duration: 0.6 });
  }

  /* ---------- Taxonomie ---------- */
  NGS.libelleCategorie = function (cat, singulier) { return NGS.t('cat.' + cat + (singulier ? '.un' : '')); };
  NGS.libelleType = function (id) { return NGS.t('type.' + id); };
  NGS.libelleSecteur = function (id) { return NGS.t('secteur.' + id); };
  NGS.secteur = function (id) { return (NGS.secteurs || []).filter(function (s) { return s.id === id; })[0]; };
  /** Badge « famille + type » (couleur de famille) et badge secteur (neutre, icône). */
  NGS.badgesHTML = function (res, opts) {
    opts = opts || {};
    var libelle = res.type ? NGS.libelleType(res.type) : NGS.libelleCategorie(res.famille, true);
    var h = '<span class="ngs-badge ngs-cat-' + res.famille + '" title="' + NGS.libelleCategorie(res.famille, true) + '">' + libelle + '</span>';
    (res.secteurs || []).forEach(function (id) {
      h += '<span class="ngs-badge ngs-badge--secteur" title="' + NGS.t('notion.secteur') + '">' + NGS.icone(NGS.secteur(id).icone, 'ngs-icon--sm') +
        '<span class="sr-only">' + NGS.t('notion.secteur') + ' : </span>' + NGS.libelleSecteur(id) + '</span>';
    });
    if (opts.reglable && res.reglable) h += '<span class="ngs-badge ngs-badge--reglable">' + NGS.t('badge.reglable') + '</span>';
    if (res.motion && opts.anime !== false) h += '<span class="ngs-badge ngs-badge--anime" title="' + NGS.t('badge.anime.titre') + '">' + NGS.icone('wave-sine', 'ngs-icon--sm') + NGS.t('badge.anime') + '</span>';
    if (opts.provisoire && res.provisoire) h += '<span class="ngs-badge ngs-badge--provisoire">' + NGS.t('badge.provisoire') + '</span>';
    return h;
  };

  /* ---------- Toasts ---------- */
  var region;
  NGS.toast = function (texte, type) {
    if (!region) {
      region = document.createElement('div');
      region.className = 'ngs-toasts';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    var t = document.createElement('div');
    t.className = 'ngs-toast ngs-toast--' + (type || 'success');
    if (type === 'error') t.setAttribute('role', 'alert');
    t.innerHTML = '<span class="ngs-toast__icon">' + NGS.icone(type === 'error' ? 'warning-circle' : 'check-circle-fill') + '</span>' +
      '<span class="ngs-toast__text"></span>' +
      '<button class="ngs-btn ngs-btn--ghost ngs-btn--icon ngs-btn--sm ngs-toast__close" type="button" aria-label="' + NGS.t('toast.fermer') + '">' + NGS.icone('x') + '</button>';
    t.querySelector('.ngs-toast__text').textContent = texte;
    region.appendChild(t);
    function retirer() {
      if (!t.isConnected) return;
      if (window.gsap && !NGS.motion.reduit) gsap.to(t, { autoAlpha: 0, y: 6, duration: 0.12, onComplete: function () { t.remove(); } });
      else t.remove();
    }
    t.querySelector('button').addEventListener('click', retirer);
    if (window.gsap && !NGS.motion.reduit) gsap.from(t, { autoAlpha: 0, y: 12, duration: 0.24, ease: 'expo.out' });
    var minuteur = setTimeout(retirer, type === 'error' ? 8000 : 4000);
    t.addEventListener('pointerenter', function () { clearTimeout(minuteur); });
    t.addEventListener('pointerleave', function () { minuteur = setTimeout(retirer, 2000); });
  };

  /* ---------- Copie ---------- */
  NGS.copier = function (texte, bouton, message) {
    var fait = function () {
      if (bouton) {
        bouton.classList.add('is-done');
        clearTimeout(bouton._ngsT);
        bouton._ngsT = setTimeout(function () { bouton.classList.remove('is-done'); }, 2200);
      }
      NGS.toast(message || NGS.t('ressource.toast.copie'));
    };
    var echec = function () { NGS.toast(NGS.t('ressource.toast.copie.erreur'), 'error'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texte).then(fait, echec);
    else {
      try {
        var ta = document.createElement('textarea');
        ta.value = texte; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); ta.remove();
        ok ? fait() : echec();
      } catch (e) { echec(); }
    }
  };

  /* ---------- Onglets (indicateur glissant) ---------- */
  NGS.onglets = function (liste, surChange) {
    var tabs = Array.prototype.slice.call(liste.querySelectorAll('[role="tab"]'));
    var ind = liste.querySelector('.ngs-tabs__indicator');
    function placer(tab) {
      if (!ind || !tab) return;
      ind.style.width = tab.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function choisir(tab, focaliser) {
      tabs.forEach(function (t) {
        var actif = t === tab;
        t.setAttribute('aria-selected', String(actif));
        t.tabIndex = actif ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !actif;
      });
      placer(tab);
      if (focaliser) tab.focus();
      if (surChange) surChange(tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { choisir(t); });
      t.addEventListener('keydown', function (e) {
        var j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (j === undefined) return;
        e.preventDefault();
        choisir(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
    var actif = liste.querySelector('[aria-selected="true"]') || tabs[0];
    requestAnimationFrame(function () { placer(actif); });
    window.addEventListener('resize', function () { placer(liste.querySelector('[aria-selected="true"]')); });
    return { choisir: choisir };
  };

  /* ---------- Groupes radio (segments, pastilles) avec itinérance aux flèches ---------- */
  NGS.radio = function (groupe, surChoix) {
    var items = function () { return Array.prototype.slice.call(groupe.querySelectorAll('[role="radio"]')); };
    function choisir(b, focus) {
      items().forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      if (focus) b.focus();
      surChoix(b);
    }
    groupe.addEventListener('click', function (e) { var b = e.target.closest('[role="radio"]'); if (b && groupe.contains(b)) choisir(b); });
    groupe.addEventListener('keydown', function (e) {
      var l = items(); var i = l.indexOf(document.activeElement);
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d === undefined || i < 0) return;
      e.preventDefault();
      choisir(l[(i + d + l.length) % l.length], true);
    });
    items().forEach(function (x) { x.tabIndex = x.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    return {
      poser: function (valeur) {
        items().forEach(function (x) { var on = x.dataset.valeur === String(valeur); x.setAttribute('aria-checked', String(on)); x.tabIndex = on ? 0 : -1; });
      }
    };
  };

  /* ---------- Case de planche ---------- */
  NGS.caseHTML = function (res, opts) {
    opts = opts || {};
    var stage;
    if (res.famille === 'designs') {
      stage = '<div class="ngs-case__stage" data-design="' + res.design + '"><div class="grid gap-4 justify-items-start w-full max-w-[18rem]">' +
        '<ngs-apercu ressource="interrupteur"></ngs-apercu><ngs-apercu ressource="curseur"></ngs-apercu></div></div>';
    } else {
      stage = '<div class="ngs-case__stage"><ngs-apercu ressource="' + res.slug + '"></ngs-apercu></div>';
    }
    return '<article class="ngs-case ngs-cat-' + res.famille + ' ' + (opts.taille === false ? '' : res.taille) + '" data-slug="' + res.slug + '" data-categorie="' + res.famille + '">' +
      stage +
      '<div class="ngs-case__foot"><div class="grid gap-1.5 min-w-0">' +
      '<h3 class="ngs-case__title"><a class="ngs-case__link" href="ressource.html?r=' + res.slug + '">' + res.titre + '</a></h3>' +
      '<div class="flex flex-wrap gap-1.5">' + NGS.badgesHTML(res) + '</div></div>' +
      '<span class="ngs-case__open" aria-hidden="true">' + NGS.icone('arrow-up-right') + '</span></div></article>';
  };
  /** Pose les tokens d'un design sur un élément (et ses aperçus). Sans mode imposé, l'aperçu suit le thème
      du site (clair ou sombre) et se rhabille quand le visiteur change de thème. */
  NGS.habiller = function (el, design, mode) {
    if (!NGS.contrat.themes) return;
    el.setAttribute('data-ngs-design', design);
    if (mode) el.setAttribute('data-ngs-mode', mode); else el.removeAttribute('data-ngs-mode');
    NGS.contrat.appliquer(el, NGS.contrat.valeurs(design, mode || NGS.theme.mode()));
  };

  /* ---------- Thème du site : clair / sombre / système ---------- */
  // Le script en ligne du <head> a déjà posé data-theme avant le premier rendu ; ici : changement et suivi du système.
  var racine = document.documentElement;
  var mqSombre = matchMedia('(prefers-color-scheme: dark)');
  NGS.theme = {
    choix: function () { return racine.getAttribute('data-theme-choix') || 'systeme'; },
    mode: function () { return racine.getAttribute('data-theme') === 'sombre' ? 'sombre' : 'clair'; },
    poser: function (choix, memoriser) {
      if (memoriser) document.cookie = 'ngs_theme=' + choix + '; Max-Age=31536000; Path=/; SameSite=Lax';
      var sombre = choix === 'sombre' || (choix === 'systeme' && mqSombre.matches);
      var avant = this.mode();
      racine.setAttribute('data-theme-choix', choix);
      if (sombre) racine.setAttribute('data-theme', 'sombre'); else racine.removeAttribute('data-theme');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', sombre ? '#111113' : '#ffffff');
      majBoutonTheme();
      if (avant !== this.mode()) {
        // Les aperçus sans mode imposé suivent le site.
        document.querySelectorAll('[data-ngs-design]:not([data-ngs-mode])').forEach(function (el) {
          NGS.contrat.appliquer(el, NGS.contrat.valeurs(el.getAttribute('data-ngs-design'), NGS.theme.mode()));
        });
        document.dispatchEvent(new CustomEvent('ngs-theme', { detail: { mode: this.mode(), choix: choix } }));
      }
    }
  };
  mqSombre.addEventListener('change', function () { if (NGS.theme.choix() === 'systeme') NGS.theme.poser('systeme', false); });
  var ICONE_THEME = { clair: 'sun', sombre: 'moon', systeme: 'desktop' };
  function majBoutonTheme() {
    var c = NGS.theme.choix();
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.setAttribute('aria-label', NGS.t('theme.bouton', { choix: NGS.t('theme.' + c).toLowerCase() }));
      var u = b.querySelector('[data-theme-icone]');
      if (u) u.setAttribute('href', site.chemins.sprite + '#' + ICONE_THEME[c]);
    });
    document.querySelectorAll('[data-theme-valeur]').forEach(function (o) {
      var on = o.getAttribute('data-theme-valeur') === c;
      o.setAttribute('aria-checked', String(on));
    });
  }
  /** Menu du thème (header) : bouton + menu de trois choix (menuitemradio), flèches, Échap, clic extérieur. */
  function menuTheme() {
    document.querySelectorAll('[data-theme-ctl]').forEach(function (ctl) {
      var btn = ctl.querySelector('[data-theme-btn]');
      var menu = ctl.querySelector('[data-theme-menu]');
      var options = Array.prototype.slice.call(menu.querySelectorAll('[data-theme-valeur]'));
      function ouvrir(o, focaliser) {
        btn.setAttribute('aria-expanded', String(o));
        menu.classList.toggle('is-open', o);
        menu.toggleAttribute('inert', !o);
        if (o && focaliser !== false) (menu.querySelector('[aria-checked="true"]') || options[0]).focus();
      }
      menu.setAttribute('inert', '');
      btn.addEventListener('click', function () { ouvrir(btn.getAttribute('aria-expanded') !== 'true'); });
      options.forEach(function (o, i) {
        o.tabIndex = -1;
        o.addEventListener('click', function () { NGS.theme.poser(o.getAttribute('data-theme-valeur'), true); ouvrir(false); btn.focus(); });
        o.addEventListener('keydown', function (e) {
          var j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: options.length - 1 }[e.key];
          if (j !== undefined) { e.preventDefault(); options[(j + options.length) % options.length].focus(); }
          if (e.key === 'Tab') ouvrir(false, false);
        });
      });
      ctl.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { ouvrir(false); btn.focus(); } });
      document.addEventListener('click', function (e) { if (!ctl.contains(e.target)) ouvrir(false, false); });
    });
    // Variante en segments (design system) : radiogroup.
    document.querySelectorAll('[data-theme-seg]').forEach(function (g) {
      NGS.radio(g, function (b) { NGS.theme.poser(b.getAttribute('data-theme-valeur'), true); });
    });
    majBoutonTheme();
  }

  /* ---------- Transitions de page ---------- */
  // 1. View Transitions entre documents (CSS @view-transition dans components.css) : la scène de la case
  //    cliquée et le cadre d'aperçu de la fiche partagent le nom « apercu-ressource » (morph).
  // 2. Repli sans View Transitions : sortie GSAP courte de <main> (ou voile depuis la case), puis navigation.
  function memeSite(a) {
    return a && a.origin === location.origin && !a.hasAttribute('download') && a.target !== '_blank' && a.getAttribute('href').charAt(0) !== '#';
  }
  NGS.sortirVers = function (href, depuisCase) {
    if (NGS.motion.reduit || !window.gsap) { location.href = href; return; }
    if (depuisCase) {
      var r = depuisCase.getBoundingClientRect();
      var voile = document.createElement('div');
      voile.className = 'ngs-voile';
      voile.setAttribute('aria-hidden', 'true');
      document.body.appendChild(voile);
      gsap.fromTo(voile,
        { x: r.left, y: r.top, scaleX: r.width / innerWidth, scaleY: r.height / innerHeight, borderRadius: 20 },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, duration: 0.5, ease: 'expo.inOut', onComplete: function () { location.href = href; } });
      return;
    }
    gsap.to('main', { autoAlpha: 0, y: -8, duration: 0.18, ease: 'power2.in', onComplete: function () { location.href = href; } });
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !memeSite(a)) return;
    if (a.closest('ngs-apercu, .ngs-vitrine__piece')) return;
    var caseEl = a.classList.contains('ngs-case__link') ? a.closest('.ngs-case') : null;
    if (NGS.motion.vtDocument) {
      // Le navigateur anime : on nomme seulement la scène partagée.
      if (caseEl) caseEl.querySelector('.ngs-case__stage').style.viewTransitionName = 'apercu-ressource';
      return;
    }
    if (a.pathname === location.pathname && a.search === location.search) return;
    e.preventDefault();
    NGS.sortirVers(a.href, caseEl);
  });
  // Retour vers une page qui contient la case de la fiche quittée : la case reprend le nom partagé.
  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
    var de = new URL(navigation.activation.from.url);
    var slug = de.searchParams.get('r');
    if (!/ressource\.html$/.test(de.pathname) || !slug) return;
    NGS.pret.then(function () {
      var c = document.querySelector('.ngs-case[data-slug="' + slug + '"] .ngs-case__stage');
      if (c) { c.style.viewTransitionName = 'apercu-ressource'; e.viewTransition.finished.finally(function () { c.style.viewTransitionName = ''; }); }
    });
  });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    document.querySelectorAll('.ngs-voile').forEach(function (v) { v.remove(); });
    document.querySelectorAll('.ngs-case__stage').forEach(function (s) { s.style.viewTransitionName = ''; });
    if (window.gsap) gsap.set('main', { clearProps: 'opacity,visibility,transform' });
  });

  /* ---------- Splash ---------- */
  var finSplash;
  NGS.splashFini = new Promise(function (r) { finSplash = r; });
  function fermerSplash() {
    var s = document.querySelector('.ngs-splash');
    if (!s || getComputedStyle(s).display === 'none' || NGS.motion.reduit) { if (s) s.remove(); finSplash(); return; }
    if (s.classList.contains('is-sortie')) return;
    var debut = window.__ngsDebut || 0;
    var attente = Math.max(0, 600 - (performance.now() - debut));
    setTimeout(function () {
      s.classList.add('is-sortie');
      setTimeout(finSplash, 120); // l'intro de l'accueil s'enchaîne pendant la sortie
      // Seule la fin de la sortie retire le splash : les animationend des tuiles (fin de chute vers 600 ms)
      // remontent jusqu'ici et coupaient la sortie au bout de 130 ms (v0.8, correction).
      s.addEventListener('animationend', function fin(e) {
        if (e.target !== s || e.animationName !== 'ngs-splash-sortie') return;
        s.removeEventListener('animationend', fin);
        s.remove();
      });
      setTimeout(function () { if (s.isConnected) s.remove(); }, 600);
    }, attente);
  }

  /* ---------- Header : bordure au scroll ---------- */
  function header() {
    var h = document.querySelector('.ngs-header');
    if (!h) return;
    var maj = function () { h.classList.toggle('is-scrolled', scrollY > 8); };
    addEventListener('scroll', maj, { passive: true });
    maj();
  }

  /* ---------- Méga-menu « Catalogue » ---------- */
  function compter() {
    var c = { famille: {}, type: {}, secteur: {} };
    NGS.registre.forEach(function (r) {
      c.famille[r.famille] = (c.famille[r.famille] || 0) + 1;
      if (r.type) c.type[r.type] = (c.type[r.type] || 0) + 1;
      (r.secteurs || []).forEach(function (id) { c.secteur[id] = (c.secteur[id] || 0) + 1; });
    });
    return c;
  }
  NGS.compter = compter;
  function megaMenu() {
    var decl = document.querySelector('[data-mega]');
    var panneau = document.getElementById('mega-catalogue');
    if (!decl || !panneau) return;
    var n = compter();
    function lien(href, contenu, compte, classe) {
      return '<li><a class="ngs-mega__lien ' + (classe || '') + '" href="' + href + '">' + contenu +
        '<span class="ngs-mega__compte' + (compte ? '' : ' is-vide') + '">' + (compte || 0) + '</span></a></li>';
    }
    function types(fam) {
      return NGS.types.filter(function (t) { return t.famille === fam; }).map(function (t) {
        return lien('catalogue.html?c=' + fam + '&type=' + t.id, '<span>' + NGS.libelleType(t.id) + '</span>', n.type[t.id]);
      }).join('');
    }
    panneau.innerHTML = '<div class="ngs-container ngs-mega__grille">' +
      '<div><p class="ngs-mega__titre">' + NGS.t('mega.familles') + '</p><ul class="ngs-mega__liste">' +
      NGS.familles.map(function (f) { return lien('catalogue.html?c=' + f.id, '<span class="ngs-nav-link__dot ngs-cat-' + f.id + '" aria-hidden="true"></span><span>' + NGS.t('cat.' + f.id) + '</span>', n.famille[f.id], 'ngs-cat-' + f.id); }).join('') +
      '</ul><a class="ngs-link ngs-link--rest mt-4 inline-flex" href="catalogue.html">' + NGS.t('mega.tout') + '</a></div>' +
      '<div><p class="ngs-mega__titre">' + NGS.t('mega.types.composants') + '</p><ul class="ngs-mega__liste ngs-mega__liste--2">' + types('composants') + '</ul></div>' +
      '<div><p class="ngs-mega__titre">' + NGS.t('mega.types.blocs') + '</p><ul class="ngs-mega__liste ngs-mega__liste--2">' + types('blocs') + '</ul></div>' +
      '<div><p class="ngs-mega__titre">' + NGS.t('mega.secteurs') + '</p><ul class="ngs-mega__liste">' +
      NGS.secteurs.map(function (s) { return lien('catalogue.html?secteur=' + s.id, NGS.icone(s.icone, 'ngs-icon--sm') + '<span>' + NGS.libelleSecteur(s.id) + '</span>', n.secteur[s.id]); }).join('') +
      '</ul></div></div>';
    var minuteur;
    function ouvrir(o) {
      clearTimeout(minuteur);
      decl.setAttribute('aria-expanded', String(o));
      panneau.classList.toggle('is-open', o);
      panneau.toggleAttribute('inert', !o);
    }
    panneau.setAttribute('inert', '');
    decl.addEventListener('click', function (e) { e.preventDefault(); ouvrir(decl.getAttribute('aria-expanded') !== 'true'); });
    if (NGS.motion.pointeurFin) {
      [decl, panneau].forEach(function (el) {
        el.addEventListener('pointerenter', function () { clearTimeout(minuteur); minuteur = setTimeout(function () { ouvrir(true); }, 120); });
        el.addEventListener('pointerleave', function () { clearTimeout(minuteur); minuteur = setTimeout(function () { ouvrir(false); }, 220); });
      });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && decl.getAttribute('aria-expanded') === 'true') { ouvrir(false); decl.focus(); } });
    document.addEventListener('click', function (e) { if (!panneau.contains(e.target) && !decl.contains(e.target)) ouvrir(false); });
  }

  /* ---------- Menu mobile ---------- */
  function menu() {
    var btn = document.querySelector('[data-menu-ouvrir]');
    var panneau = document.getElementById('menu-mobile');
    if (!btn || !panneau) return;
    var fermer = panneau.querySelector('[data-menu-fermer]');
    var sect = panneau.querySelector('[data-menu-secteurs]');
    if (sect) {
      var n = compter();
      sect.innerHTML = NGS.secteurs.map(function (s) {
        return '<li><a class="ngs-mega__lien" href="catalogue.html?secteur=' + s.id + '">' + NGS.icone(s.icone, 'ngs-icon--sm') + '<span>' + NGS.libelleSecteur(s.id) +
          '</span><span class="ngs-mega__compte' + (n.secteur[s.id] ? '' : ' is-vide') + '">' + (n.secteur[s.id] || 0) + '</span></a></li>';
      }).join('');
    }
    function ouvrir(o) {
      panneau.classList.toggle('is-open', o);
      btn.setAttribute('aria-expanded', String(o));
      panneau.toggleAttribute('inert', !o);
      document.documentElement.style.overflow = o ? 'hidden' : '';
      if (o) {
        (fermer || panneau).focus();
        if (window.gsap && !NGS.motion.reduit) gsap.from(panneau.querySelectorAll('.ngs-menu__link'), { y: 16, autoAlpha: 0, stagger: 0.04, duration: 0.4, ease: 'expo.out', delay: 0.05 });
      } else btn.focus();
    }
    panneau.setAttribute('inert', '');
    btn.addEventListener('click', function () { ouvrir(true); });
    fermer && fermer.addEventListener('click', function () { ouvrir(false); });
    panneau.addEventListener('keydown', function (e) { if (e.key === 'Escape') ouvrir(false); });
  }

  /* ---------- Recherche (dialogue ⌘K) ---------- */
  function normaliser(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  NGS.normaliser = normaliser;
  NGS.chercher = function (q) {
    var n = normaliser(q.trim());
    if (!n) return NGS.registre.slice();
    return NGS.registre.filter(function (r) {
      var texte = normaliser([r.titre, r.description, r.tags.join(' '), NGS.libelleCategorie(r.famille),
        r.type ? NGS.libelleType(r.type) : ''].concat((r.secteurs || []).map(NGS.libelleSecteur)).join(' '));
      return n.split(/\s+/).every(function (mot) { return texte.indexOf(mot) !== -1; });
    });
  };
  function recherche() {
    var dlg = document.createElement('dialog');
    dlg.className = 'ngs-dialog';
    dlg.setAttribute('aria-label', NGS.t('recherche.label'));
    dlg.innerHTML =
      '<div class="ngs-dialog__head">' + NGS.icone('magnifying-glass', 'ngs-icon--lg') +
      '<label class="sr-only" for="recherche-globale">' + NGS.t('recherche.label') + '</label>' +
      '<input class="ngs-input" id="recherche-globale" type="search" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="recherche-resultats" placeholder="' + NGS.t('recherche.placeholder') + '">' +
      '<button class="ngs-btn ngs-btn--ghost ngs-btn--icon" type="button" data-fermer aria-label="' + NGS.t('recherche.fermer') + '">' + NGS.icone('x') + '</button></div>' +
      '<div class="ngs-dialog__body"><p class="sr-only">' + NGS.t('recherche.aide') + '</p><ul class="ngs-results" id="recherche-resultats" role="listbox"></ul></div>';
    document.body.appendChild(dlg);
    var champ = dlg.querySelector('input');
    var liste = dlg.querySelector('.ngs-results');
    var actif = 0;
    function surligner(txt, q) {
      var e = txt.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (!q.trim()) return e;
      var i = normaliser(e).indexOf(normaliser(q.trim()));
      return i < 0 ? e : e.slice(0, i) + '<mark>' + e.slice(i, i + q.trim().length) + '</mark>' + e.slice(i + q.trim().length);
    }
    function rendre() {
      var q = champ.value;
      var res = NGS.chercher(q);
      actif = 0;
      if (!res.length) {
        liste.innerHTML = '<li class="p-6 grid gap-1"><p class="font-semibold m-0">' + NGS.t('recherche.vide.titre', { q: q.replace(/</g, '&lt;') }) + '</p><p class="ngs-muted m-0 ngs-small">' + NGS.t('recherche.vide.texte') + '</p>' +
          '<p class="m-0 mt-2"><a class="ngs-link ngs-link--rest" href="catalogue.html">' + NGS.t('recherche.toutes') + '</a></p></li>';
        champ.removeAttribute('aria-activedescendant');
        return;
      }
      liste.innerHTML = res.map(function (r, i) {
        var sous = [r.type ? NGS.libelleType(r.type) : NGS.libelleCategorie(r.famille, true)].concat((r.secteurs || []).map(NGS.libelleSecteur)).join(', ');
        return '<li role="presentation"><a class="ngs-result ngs-cat-' + r.famille + '" id="res-' + r.slug + '" role="option" aria-selected="' + (i === 0) + '" href="ressource.html?r=' + r.slug + '">' +
          '<span class="ngs-chip__dot" aria-hidden="true"></span><span class="grid gap-0.5 min-w-0"><span class="ngs-result__title">' + surligner(r.titre, q) + '</span>' +
          '<span class="ngs-result__desc">' + sous + '</span></span></a></li>';
      }).join('');
      champ.setAttribute('aria-activedescendant', 'res-' + res[0].slug);
    }
    function deplacer(d) {
      var opts = liste.querySelectorAll('[role="option"]');
      if (!opts.length) return;
      opts[actif].setAttribute('aria-selected', 'false');
      actif = (actif + d + opts.length) % opts.length;
      opts[actif].setAttribute('aria-selected', 'true');
      opts[actif].scrollIntoView({ block: 'nearest' });
      champ.setAttribute('aria-activedescendant', opts[actif].id);
    }
    champ.addEventListener('input', rendre);
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); deplacer(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); deplacer(-1); }
      if (e.key === 'Enter') { var o = liste.querySelector('[aria-selected="true"]'); if (o) { e.preventDefault(); location.href = o.getAttribute('href'); } }
    });
    dlg.querySelector('[data-fermer]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    function ouvrir() { if (dlg.open) return; champ.value = ''; rendre(); dlg.showModal(); champ.focus(); }
    document.querySelectorAll('[data-recherche]').forEach(function (b) { b.addEventListener('click', ouvrir); });
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable)) {
        e.preventDefault(); ouvrir();
      }
    });
  }

  /* ---------- Pied de page : liens de Sidy, signature animée ---------- */
  function pied() {
    var a = site.auteur;
    document.querySelectorAll('[data-auteur-nom]').forEach(function (el) { el.textContent = a.nomComplet || a.nom; });
    document.querySelectorAll('[data-reseau]').forEach(function (l) {
      var k = l.dataset.reseau;
      l.href = k === 'email' ? 'mailto:' + a.email : a[k];
      if (k !== 'email') { l.target = '_blank'; l.rel = 'me noopener'; }
    });
    var sig = document.querySelector('[data-signature]');
    if (!sig || !window.gsap || NGS.motion.reduit) return;
    var trace = sig.querySelector('[data-signature-trace]');
    var lg = trace.getTotalLength();
    gsap.set(trace, { strokeDasharray: lg, strokeDashoffset: lg });
    var dessiner = function () { gsap.fromTo(trace, { strokeDashoffset: lg }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }); };
    if (window.ScrollTrigger) ScrollTrigger.create({ trigger: sig, start: 'top 95%', once: true, onEnter: dessiner });
    else dessiner();
    sig.addEventListener('pointerenter', dessiner);
  }

  /* ---------- Démarrage ---------- */
  NGS.pret = Promise.all([
    window.ngsStylesReady || Promise.resolve(),
    NGS.contrat.charger(site.chemins.contrat)
  ]).then(function () {
    NGS.appliquerTextes();
    var titre = document.documentElement.dataset.titre;
    if (titre) document.title = NGS.t(titre);
    header();
    menuTheme();
    megaMenu();
    menu();
    recherche();
    pied();
    fermerSplash();
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
      document.querySelectorAll('[data-raccourci]').forEach(function (k) { k.textContent = 'Ctrl K'; });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
  // Filet : le splash ne reste jamais plus de 1,2 s (ADR 0005), même si le CSS de sécurité n'a pas encore agi.
  // La sortie dure 320 ms : elle commence au plus tard à 880 ms pour que le splash ait disparu à 1,2 s.
  setTimeout(fermerSplash, 880);
})();
