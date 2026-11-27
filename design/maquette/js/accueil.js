/*
  Accueil : planche vivante, habillage par design, familles épinglées, gestes, contrat de tokens,
  tracé de contribution. Motion niveau 1 (Convaincre), Lenis sur cette page seulement.
  Chaque animation correspond à une ligne du tableau validé (DESIGN.md, Motion).
*/
(function () {
  var NGS = window.NGS;

  // Disposition propre à l'accueil (la planche est composée, le catalogue suit le registre).
  var PLANCHE = [
    ['calendrier', 'ngs-case--wide ngs-case--tall'],
    ['interrupteur', ''],
    ['carte-sejour', 'ngs-case--tall'],
    ['curseur', ''],
    ['notifications', 'ngs-case--wide'],
    ['boutons', 'ngs-case--wide'],
    ['questions-frequentes', 'ngs-case--wide ngs-case--tall'],
    ['champ-email', ''],
    ['fleuve', ''],
    ['planche', ''],
    ['laterite', '']
  ];

  var designCourant = 'planche';

  function construirePlanche() {
    var el = document.querySelector('[data-planche]');
    el.innerHTML = PLANCHE.map(function (p) {
      var res = Object.assign({}, NGS.trouver(p[0]), { taille: p[1] });
      return NGS.caseHTML(res);
    }).join('');
    el.querySelectorAll('.ngs-case').forEach(function (c) {
      var stageDesign = c.querySelector('[data-design]');
      if (stageDesign) NGS.habiller(stageDesign, stageDesign.dataset.design);
      else NGS.habiller(c, designCourant);
    });
  }

  /* Habillage par un design : la vitrine puis les cases, en vague (mécanisme emprunté au concept C). */
  function habiller() {
    var cibles = function () {
      return [document.querySelector('[data-vitrine]')].concat(Array.prototype.slice.call(document.querySelectorAll('[data-planche] .ngs-case'))
        .filter(function (c) { return !c.querySelector('[data-design]'); }));
    };
    NGS.radio(document.querySelector('[data-habiller]'), function (b) {
      if (b.dataset.valeur === designCourant) return;
      designCourant = b.dataset.valeur;
      var l = cibles();
      if (!window.gsap || NGS.motion.reduit) { l.forEach(function (c) { NGS.habiller(c, designCourant); }); return; }
      l.forEach(function (c, i) {
        gsap.delayedCall(i * 0.06, function () { NGS.habiller(c, designCourant); });
        if (i) gsap.fromTo(c, { scale: 1 }, { scale: 0.985, duration: 0.12, delay: i * 0.06, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'transform' });
      });
    });
    NGS.habiller(document.querySelector('[data-vitrine]'), designCourant);
  }

  function construireFamilles() {
    var piste = document.querySelector('[data-piste]');
    var compte = {};
    NGS.registre.forEach(function (r) { compte[r.famille] = (compte[r.famille] || 0) + 1; });
    function vitrine(cat) {
      if (cat === 'templates') {
        return '<div class="ngs-state" style="background:transparent"><span class="ngs-state__icon">' + NGS.icone('browser', 'ngs-icon--lg') + '</span>' +
          '<p class="ngs-state__title" data-t="accueil.familles.templates.vide">' + NGS.t('accueil.familles.templates.vide') + '</p>' +
          '<a class="ngs-btn ngs-btn--secondary" href="index.html#contribuer">' + NGS.t('accueil.familles.templates.cta') + '</a></div>';
      }
      if (cat === 'designs') {
        return '<div class="grid gap-3">' + NGS.registre.filter(function (r) { return r.famille === 'designs'; }).map(function (r) {
          var v = NGS.contrat.valeurs(r.design, 'clair');
          var s = NGS.contrat.valeurs(r.design, 'sombre');
          return '<a class="ngs-case ngs-cat-designs no-underline text-inherit" href="ressource.html?r=' + r.slug + '" style="flex-direction:row;align-items:center;gap:1rem;padding:1rem;min-height:5rem;color:inherit;text-decoration:none">' +
            '<span class="flex" aria-hidden="true">' + [v['--ngs-color-action'], v['--ngs-color-surface-alt'], s['--ngs-color-surface'], s['--ngs-color-action']].map(function (c) {
              return '<span style="width:2.25rem;height:2.25rem;border-radius:' + v['--ngs-radius'] + ';background:' + c + ';box-shadow:inset 0 0 0 1px var(--color-contour);margin-right:-.4rem"></span>';
            }).join('') + '</span><span class="font-semibold ml-3">' + r.nomDesign + '</span>' +
            '<span class="ml-auto ngs-case__open">' + NGS.icone('arrow-up-right') + '</span></a>';
        }).join('') + '</div>';
      }
      var slugs = cat === 'composants' ? ['interrupteur', 'curseur'] : ['questions-frequentes'];
      return '<div class="famille__vitrine">' + slugs.map(function (s) { return NGS.caseHTML(NGS.trouver(s), { taille: false }); }).join('') + '</div>';
    }
    piste.innerHTML = NGS.familles.map(function (c) {
      var n = compte[c.id] || 0;
      return '<article class="famille ngs-cat-' + c.id + '" aria-labelledby="famille-' + c.id + '">' +
        '<div class="famille__texte grid gap-4 content-end">' +
        '<h3 class="famille__nom" id="famille-' + c.id + '">' + NGS.t('cat.' + c.id) + '</h3>' +
        '<p class="famille__compte">' + NGS.pluriel(n) + '</p>' +
        '<p class="ngs-lead m-0 max-w-[32ch]" style="color:var(--color-text)">' + NGS.t('cat.' + c.id + '.texte') + '</p>' +
        (n ? '<a class="ngs-link ngs-link--rest justify-self-start" href="catalogue.html?c=' + c.id + '">' + NGS.t('accueil.familles.' + c.id + '.cta') +
          ' ' + NGS.icone('arrow-right', 'ngs-icon--sm ngs-icon--move') + '</a>' : '') +
        '</div><div class="famille__vitrine-wrap self-center">' + vitrine(c.id) + '</div></article>';
    }).join('');
    piste.querySelectorAll('.famille__vitrine .ngs-case').forEach(function (c) { NGS.habiller(c, 'planche'); });
  }

  function construireGestes() {
    var res = NGS.trouver('interrupteur');
    var code = NGS.codeAngular(res, 'tailwind').ts;
    document.querySelector('[data-code-demo]').innerHTML = NGS.surligner(code, 'ts');
    var bouton = document.querySelector('[data-copier-demo]');
    bouton.addEventListener('click', function () { NGS.copier(code, bouton, NGS.t('ressource.toast.copie.fichier', { fichier: 'interrupteur.component.ts' })); });
    var zip = NGS.zipRessource(res, 'planche', {}, 'tailwind');
    document.querySelector('[data-zip-liste]').innerHTML = zip.entrees.map(function (e) {
      return '<li>' + NGS.icone(/\.md$|LICENSE/.test(e.nom) ? 'book-open' : 'code', 'ngs-icon--sm') + '<span>' + e.nom.split('/')[1] + '</span><span>' + NGS.taille(e.contenu) + '</span></li>';
    }).join('');
    var bz = document.querySelector('[data-zip-demo]');
    bz.addEventListener('click', function () {
      NGS.telechargerBlob(zip.blob, zip.nom);
      NGS.toast(NGS.t('ressource.toast.zip', { fichier: zip.nom }));
    });
  }

  function construireJetons() {
    var liste = document.querySelector('[data-jetons]');
    var fleuve = NGS.contrat.valeurs('fleuve', NGS.theme.mode());
    liste.innerHTML = NGS.contrat.ordre.map(function (k) {
      return '<div class="jeton" data-jeton="' + k + '"><span class="jeton__nom">' + k + '</span><span class="jeton__valeur">' + fleuve[k].split(',')[0] + '</span>' +
        '<p class="jeton__role">' + NGS.t('jeton.' + k) + '</p></div>';
    }).join('');
    NGS.habiller(document.querySelector('[data-temoin-scene]'), 'planche');
  }

  /* ------------------------------------------------------------------ */
  /* Motion                                                              */
  /* ------------------------------------------------------------------ */
  function motion() {
    if (!window.gsap) return;
    var mm = gsap.matchMedia();
    var scene = document.querySelector('[data-temoin-scene]');
    // Valeurs lues au moment du changement : elles suivent le thème du site (clair ou sombre).
    var valeur = function (design, k) { return NGS.contrat.valeurs(design, NGS.theme.mode())[k]; };

    // Contrat de tokens : un état par jeton (aussi sans motion : c'est un changement d'état).
    document.querySelectorAll('[data-jeton]').forEach(function (row) {
      var k = row.dataset.jeton;
      ScrollTrigger.create({
        trigger: row, start: 'top 62%',
        onEnter: function () { row.classList.add('is-actif'); scene.style.setProperty(k, valeur('fleuve', k)); },
        onLeaveBack: function () { row.classList.remove('is-actif'); scene.style.setProperty(k, valeur('planche', k)); }
      });
    });
    // Changement de thème : la scène vient d'être rhabillée en Planche ; les jetons déjà allumés reprennent Fleuve.
    document.addEventListener('ngs-theme', function () {
      document.querySelectorAll('[data-jeton].is-actif').forEach(function (row) { scene.style.setProperty(row.dataset.jeton, valeur('fleuve', row.dataset.jeton)); });
      document.querySelectorAll('[data-jeton]').forEach(function (row) { row.querySelector('.jeton__valeur').textContent = valeur('fleuve', row.dataset.jeton).split(',')[0]; });
    });

    mm.add({
      animer: '(prefers-reduced-motion: no-preference)',
      large: '(min-width: 64rem)',
      fin: '(hover: hover) and (pointer: fine)'
    }, function (ctx) {
      var c = ctx.conditions;
      if (!c.animer) return;
      document.documentElement.classList.add('ngs-motion');

      /* Lenis : défilement doux, accueil uniquement. */
      var lenis = null;
      if (window.Lenis) {
        lenis = new Lenis({ autoRaf: false, anchors: { offset: -80 }, prevent: function (n) { return n.closest && n.closest('pre, dialog, .ngs-menu'); } });
        lenis.on('scroll', ScrollTrigger.update);
        var tick = function (t) { lenis.raf(t * 1000); };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      /* 1. Hero : titre ligne par ligne, puis la vitrine s'assemble pièce par pièce, puis les étiquettes. */
      var h1 = document.getElementById('hero-titre');
      var split = SplitText.create(h1, { type: 'lines', mask: 'lines', linesClass: 'line' });
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tl.from(split.lines, { yPercent: 110, duration: 1, stagger: 0.09 })
        .from('[data-hero-texte] > :not(h1)', { y: 16, autoAlpha: 0, duration: 0.7, stagger: 0.06 }, 0.3)
        .fromTo('[data-vitrine-cadre]', { clipPath: 'inset(0 0 100% 0 round 20px)', scale: 0.97 }, { clipPath: 'inset(0 0 0% 0 round 20px)', scale: 1, duration: 1.1 }, 0.25)
        .from('[data-vitrine] [data-piece]', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 0.55)
        .from('.ngs-vitrine__flottant--cal', { y: 60, rotate: -3, autoAlpha: 0, duration: 1 }, 0.85)
        .from('.ngs-vitrine__flottant--toast', { y: -24, autoAlpha: 0, duration: 0.8 }, 1.05)
        .from('[data-etiquette]', { scale: 0.6, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, 1.25);
      /* Planche : les cases se posent à l'entrée dans l'écran (rangée par rangée).
         fromTo avec un état final explicite + clearProps : aucune case ne garde de décalage (cause des cases
         collées en v0.2 : un from() lisait un transform en cours de transition CSS). */
      gsap.set('[data-planche] .ngs-case', { y: 36, scale: 0.96, autoAlpha: 0 });
      ScrollTrigger.batch('[data-planche] .ngs-case', {
        start: 'top 92%', once: true,
        onEnter: function (els) {
          gsap.fromTo(els, { y: 36, scale: 0.96, autoAlpha: 0 }, {
            y: 0, scale: 1, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06, overwrite: true,
            clearProps: 'transform,opacity,visibility'
          });
        }
      });
      // L'intro démarre à la sortie du splash (ADR 0005), ou tout de suite s'il n'y en a pas.
      (NGS.splashFini || Promise.resolve()).then(function () { tl.play(); });

      /* Profondeur au pointeur : les pièces flottantes suivent légèrement la souris (images, jamais du texte courant). */
      if (c.fin && c.large) {
        var vitrine = document.querySelector('[data-vitrine]');
        var suiveurs = Array.prototype.map.call(document.querySelectorAll('[data-flottant]'), function (el) {
          return { p: Number(el.dataset.profondeur), x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }) };
        });
        vitrine.addEventListener('pointermove', function (e) {
          var r = vitrine.getBoundingClientRect();
          var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
          suiveurs.forEach(function (s) { s.x(dx * s.p); s.y(dy * s.p); });
        });
        vitrine.addEventListener('pointerleave', function () { suiveurs.forEach(function (s) { s.x(0); s.y(0); }); });
      }

      /* Bouton magnétique discret sur l'action principale. */
      if (c.fin) {
        var cta = document.querySelector('[data-magnet]');
        var qx = gsap.quickTo(cta, 'x', { duration: 0.35, ease: 'power3.out' });
        var qy = gsap.quickTo(cta, 'y', { duration: 0.35, ease: 'power3.out' });
        cta.addEventListener('pointermove', function (e) {
          var r = cta.getBoundingClientRect();
          qx(((e.clientX - r.left) / r.width - 0.5) * 10);
          qy(((e.clientY - r.top) / r.height - 0.5) * 8);
        });
        cta.addEventListener('pointerleave', function () { qx(0); qy(0); });
      }

      /* 2. Familles : défilement horizontal épinglé (desktop) ; empilées sinon. */
      var section = document.querySelector('[data-familles]');
      var piste = section.querySelector('[data-piste]');
      if (c.large) {
        section.classList.add('familles--pin');
        var distance = function () { return piste.scrollWidth - document.documentElement.clientWidth; };
        var deplacement = gsap.to(piste, {
          x: function () { return -distance(); }, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: function () { return '+=' + distance(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
        });
        piste.querySelectorAll('.famille').forEach(function (f) {
          // v0.4 (Chivo, sans axe de largeur) : la graisse passe de 460 à 800 et l'approche se resserre.
          gsap.fromTo(f.querySelector('.famille__nom'), { '--wght': 460 }, {
            '--wght': 800, ease: 'none',
            scrollTrigger: { trigger: f, containerAnimation: deplacement, start: 'left 85%', end: 'center 50%', scrub: true }
          });
        });
      } else {
        ScrollTrigger.batch(piste.querySelectorAll('.famille'), {
          start: 'top 85%', once: true,
          onEnter: function (els) { gsap.fromTo(els, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }); }
        });
      }

      /* 3. Gestes : la démonstration change de vue avec la rangée active (desktop). */
      var rangees = document.querySelectorAll('[data-gestes] [data-vue]');
      var vues = document.querySelectorAll('[data-vue-panneau]');
      function montrer(nom) {
        vues.forEach(function (v) {
          var actif = v.dataset.vuePanneau === nom;
          if (actif && v.hidden) {
            v.hidden = false;
            gsap.fromTo(v, { clipPath: 'inset(0 0 100% 0 round 20px)' }, { clipPath: 'inset(0 0 0% 0 round 20px)', duration: 0.7, ease: 'expo.out' });
            if (nom === 'telecharger') gsap.from(v.querySelectorAll('.zip-liste li'), { x: -12, autoAlpha: 0, stagger: 0.05, duration: 0.45, delay: 0.15 });
          } else if (!actif) v.hidden = true;
        });
        rangees.forEach(function (r) { r.classList.toggle('is-actif', r.dataset.vue === nom); });
      }
      if (c.large) {
        rangees.forEach(function (r) {
          ScrollTrigger.create({ trigger: r, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { if (s.isActive) montrer(r.dataset.vue); } });
        });
        montrer('copier');
      } else {
        rangees.forEach(function (r) { r.classList.add('is-actif'); });
        gsap.utils.toArray(vues).forEach(function (v) {
          gsap.from(v, { clipPath: 'inset(0 0 100% 0 round 20px)', duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: v, start: 'top 85%', once: true } });
        });
      }

      /* 4. Titres de section : mots qui montent depuis un masque (titres courts uniquement). */
      ['#familles-titre', '#gestes-titre', '#contrat-titre', '#contribuer-titre'].forEach(function (sel) {
        var el = document.querySelector(sel);
        var s = SplitText.create(el, { type: 'words', mask: 'words' });
        gsap.from(s.words, { yPercent: 105, duration: 0.8, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });

      /* 5. Contribuer : le parcours se dessine au scroll. */
      var chemin = document.querySelector('[data-trace-chemin]');
      var lg = chemin.getTotalLength();
      gsap.set(chemin, { strokeDasharray: lg, strokeDashoffset: lg });
      var noeuds = document.querySelectorAll('[data-trace-noeud]');
      gsap.set(noeuds, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' });
      var tr = gsap.timeline({ scrollTrigger: { trigger: '[data-trace]', start: 'top 85%', end: 'bottom 80%', scrub: 0.8 } });
      tr.to(chemin, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
      [0, 0.33, 0.66, 0.98].forEach(function (pos, i) { tr.to(noeuds[i], { autoAlpha: 1, scale: 1, duration: 0.08, ease: 'power2.out' }, pos); });

      return function () {
        document.documentElement.classList.remove('ngs-motion');
        vues.forEach(function (v) { v.hidden = false; });
        section.classList.remove('familles--pin');
        if (lenis) lenis.destroy();
        split.revert();
      };
    });

    ScrollTrigger.refresh();
  }

  NGS.pret.then(function () {
    construirePlanche();
    habiller();
    construireFamilles();
    construireGestes();
    construireJetons();
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
      document.querySelectorAll('[data-raccourci]').forEach(function (k) { k.textContent = 'Ctrl K'; });
    }
    requestAnimationFrame(motion);
  });
})();
