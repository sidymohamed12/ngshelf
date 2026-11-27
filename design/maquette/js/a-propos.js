/*
  Page « À propos » (v0.6) : page vitrine de niveau 1, avec Lenis, GSAP, ScrollTrigger et SplitText.
  - Le nom, la photo et les liens de l'auteur viennent de config.js (NGS.site.auteur) : rien n'est recopié ici.
  - Les chiffres sont lus dans le registre et le contrat (jamais inventés).
  Motion (tableau dans DESIGN.md) :
    1. Hero : les mots du titre basculent en place ; cinq vraies pièces arrivent de loin, tournoient et s'assemblent ;
       au pointeur, elles flottent selon leur profondeur ; au scroll, elles se démontent.
    2. Chiffres : les tuiles se révèlent, les compteurs montent, les carrés des ressources se posent un à un,
       les jetons s'allument, les pastilles de design arrivent, la bascule Tailwind / CSS glisse, « Créer un compte » se raye.
    2 bis. Pour qui (v0.7) : moment épinglé (desktop). Le manifeste se lit mot à mot (du gris au noir) ; à droite,
       le code « avant » s'écrit ligne à ligne, chaque « À faire » se raye, puis le vrai calendrier prend sa place.
    2 ter. Comment c'est fait (v0.7) : le point actif suit la progression du scroll dans la section (desktop) ou le clic ;
       les panneaux sont empilés dans la même cellule : l'ancien s'efface pendant que le nouveau se révèle.
    3. Moment fort épinglé (≥ 1024 px) : « Copier, Régler, Livrer ». La scène passe du code aux pièces
       qui changent de design, puis au zip ; la graisse des étapes suit le scroll.
    4. Titres de section : mots qui montent depuis un masque.
    5. Photos : révélation en masque (clip-path) et parallaxe dans leur cadre.
    6. Qui le développe : le portrait se révèle de bas en haut, les carrés de famille se posent, le nom monte lettre par lettre.
  Mobile : pas d'épinglage ni de parallaxe, révélations simples. Mouvement réduit : tout est affiché, immobile.
*/
(function () {
  var NGS = window.NGS;

  /* Photo d'illustration de « Comment c'est fait » (Unsplash, Lagos, par @disruptxn, fournie par Sidy en v0.5 ;
     crédits dans assets/images/CREDITS.md). Le HTML porte déjà ces valeurs ; l'objet reste le point unique à changer. */
  var ILLUSTRATION = {
    src: './assets/images/lagos-code-1024.webp',
    srcset: './assets/images/lagos-code-640.webp 640w, ./assets/images/lagos-code-1024.webp 1024w',
    alt: 'Ordinateur portable ouvert sur un éditeur de code et un terminal, à Lagos.'
  };

  var DESIGNS = ['planche', 'fleuve', 'laterite'];
  var habit, designCourant = -1;
  function poserDesign(i) {
    if (i === designCourant) return;
    designCourant = i;
    NGS.habiller(habit, DESIGNS[i]);
    var d = NGS.trouver(DESIGNS[i]);
    document.querySelector('[data-ap-design]').textContent = d ? d.nomDesign : DESIGNS[i];
  }

  /* Valeurs réelles : registre, contrat de tokens, designs, variantes de code. */
  function valeurs() {
    return {
      n: NGS.registre.length,
      t: NGS.contrat.ordre.length,
      d: NGS.registre.filter(function (r) { return r.famille === 'designs'; }).length,
      v: 2,
      z: 0
    };
  }

  function chiffres() {
    var v = valeurs();
    document.querySelectorAll('[data-compte]').forEach(function (s) { s.textContent = String(v[s.getAttribute('data-compte')]); });
    // Un carré par ressource du registre, dans la couleur de sa famille, et la légende avec les vrais comptes.
    document.querySelector('[data-ap-carres]').innerHTML = NGS.registre.map(function (r) { return '<span class="ngs-cat-' + r.famille + '"></span>'; }).join('');
    var parFamille = {};
    NGS.registre.forEach(function (r) { parFamille[r.famille] = (parFamille[r.famille] || 0) + 1; });
    document.querySelector('[data-ap-legende]').innerHTML = NGS.familles.filter(function (f) { return parFamille[f.id]; }).map(function (f) {
      return '<span class="ngs-cat-' + f.id + '"><i></i>' + NGS.t('apropos.chiffres.legende', { n: parFamille[f.id], famille: NGS.t('cat.' + f.id).toLowerCase() }) + '</span>';
    }).join('');
    document.querySelector('[data-ap-jetons]').innerHTML = NGS.contrat.ordre.map(function (k) { return '<li>' + k.replace('--ngs-', '') + '</li>'; }).join('');
    document.querySelector('[data-ap-pastilles]').innerHTML = NGS.registre.filter(function (r) { return r.famille === 'designs'; }).map(function (r) {
      var c = NGS.contrat.valeurs(r.design, 'clair');
      return '<span style="--sw:' + c['--ngs-color-action'] + ';--sw-texte:' + c['--ngs-color-on-action'] + ';--r:' + c['--ngs-radius'] + '">' + r.nomDesign + '</span>';
    }).join('');
  }

  /* Comment c'est fait : un panneau par point, choisi au clic (et au scroll en desktop). */
  var pointActif = 0, panneauAnime = true;
  function montrerPoint(i, depuisScroll) {
    if (i === pointActif) return;
    var avant = document.querySelector('[data-ap-pvue="' + pointActif + '"]');
    var apres = document.querySelector('[data-ap-pvue="' + i + '"]');
    pointActif = i;
    document.querySelectorAll('[data-ap-point]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.apPoint) === i)); });
    // Vues empilées dans la même cellule (hauteur constante) : fondu croisé, l'entrante se révèle de haut en bas.
    avant.classList.remove('is-active'); avant.setAttribute('aria-hidden', 'true');
    apres.classList.add('is-active'); apres.removeAttribute('aria-hidden');
    if (window.gsap && panneauAnime && !NGS.motion.reduit) {
      gsap.killTweensOf([avant, apres]);
      gsap.fromTo(avant, { autoAlpha: 1 }, { autoAlpha: 0, y: -6, duration: 0.25, ease: 'power2.in', clearProps: 'opacity,visibility,transform' });
      gsap.fromTo(apres, { autoAlpha: 0, y: 10, clipPath: 'inset(0% 0% 100% 0% round 20px)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 0.55, ease: 'expo.out', delay: 0.05, clearProps: 'opacity,visibility,transform,clipPath' });
    }
    // Petite démonstration à l'arrivée : la version bascule en CSS, le design passe à Fleuve (une fois, sans boucle).
    if (i === 1 && !montrerPoint.vu1) { montrerPoint.vu1 = true; setTimeout(function () { choisirVariante('css'); }, 700); }
    if (i === 2 && !montrerPoint.vu2) { montrerPoint.vu2 = true; setTimeout(function () { choisirDesign('fleuve'); }, 700); }
  }
  var rVariante, rDesign;
  function choisirVariante(v) {
    var res = NGS.trouver('interrupteur');
    // Extrait court (le template commence par le bouton) : 8 lignes, avec retour à la ligne dans le panneau.
    var html = NGS.codeAngular(res, v).html.split('\n').slice(0, 8).join('\n') + '\n  …';
    document.querySelector('[data-ap-extrait-html]').innerHTML = NGS.surligner(html, 'html');
    if (rVariante) rVariante.poser(v);
  }
  function choisirDesign(d) {
    NGS.habiller(document.querySelector('[data-ap-habit-tokens]'), d);
    if (rDesign) rDesign.poser(d);
  }
  function comment() {
    var res = NGS.trouver('interrupteur');
    // Extrait court : sans les imports (longs), du décorateur aux signaux d'entrée.
    var ts = NGS.codeAngular(res, 'tailwind').ts.split('\n').filter(function (l) { return !/^import/.test(l) && l.trim(); }).slice(0, 10).join('\n') + '\n  …';
    document.querySelector('[data-ap-extrait-ts]').innerHTML = NGS.surligner(ts, 'ts');
    rVariante = NGS.radio(document.querySelector('[data-ap-variante]'), function (b) { choisirVariante(b.dataset.valeur); });
    rDesign = NGS.radio(document.querySelector('[data-ap-designs]'), function (b) { choisirDesign(b.dataset.valeur); });
    choisirVariante('tailwind');
    choisirDesign('planche');
    var hab = document.querySelector('[data-ap-habit-anim]');
    NGS.habiller(hab, 'planche');
    var cible = document.querySelector('[data-ap-anim-cible]');
    document.querySelector('[data-ap-anim]').addEventListener('change', function (e) { cible.classList.toggle('ngs-sans-animation', !e.target.checked); });
    document.querySelectorAll('[data-ap-point]').forEach(function (b) {
      b.addEventListener('click', function () { montrerPoint(Number(b.dataset.apPoint)); });
    });
  }

  function contenu() {
    var a = NGS.site.auteur;
    var nom = a.nomComplet || a.nom;
    document.querySelectorAll('[data-nav="a-propos"]').forEach(function (l) { l.setAttribute('aria-current', 'page'); });
    // Libellé lisible de chaque lien, tiré de l'adresse de config.js (rien n'est recopié dans la page).
    document.querySelectorAll('[data-reseau-texte]').forEach(function (el) {
      var k = el.getAttribute('data-reseau-texte');
      var v = a[k] || '';
      el.textContent = k === 'email' ? v : v.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    });
    document.querySelectorAll('[data-auteur-alt]').forEach(function (img) { img.alt = nom; });
    var depot = document.querySelector('[data-depot]');
    if (NGS.site.depot) {
      depot.href = NGS.site.depot;
      var note = document.querySelector('[data-depot-provisoire]');
      if (note) note.hidden = true;
    }

    chiffres();
    comment();
    // Pièces du hero et scènes des cas : design Planche, dans le thème du site.
    document.querySelectorAll('[data-ap-piece], [data-ap-apres-piece]').forEach(function (el) { NGS.habiller(el, 'planche'); });

    // Trois gestes : vrai code, vraies pièces, vrai zip.
    var res = NGS.trouver('interrupteur');
    var code = NGS.codeAngular(res, 'tailwind').ts;
    document.querySelector('[data-ap-code]').innerHTML = NGS.surligner(code, 'ts');
    var bc = document.querySelector('[data-ap-copier]');
    bc.addEventListener('click', function () { NGS.copier(code, bc, NGS.t('ressource.toast.copie.fichier', { fichier: 'interrupteur.component.ts' })); });
    var zip = NGS.zipRessource(res, 'planche', {}, 'tailwind');
    document.querySelector('[data-ap-zip-nom]').textContent = zip.nom;
    document.querySelector('[data-ap-zip]').innerHTML = zip.entrees.map(function (e) {
      return '<li>' + NGS.icone(/\.md$|LICENSE/.test(e.nom) ? 'book-open' : 'code', 'ngs-icon--sm') + '<span>' + e.nom.split('/')[1] + '</span><span>' + NGS.taille(e.contenu) + '</span></li>';
    }).join('');
    document.querySelector('[data-ap-telecharger]').addEventListener('click', function () {
      NGS.telechargerBlob(zip.blob, zip.nom);
      NGS.toast(NGS.t('ressource.toast.zip', { fichier: zip.nom }));
    });
    habit = document.querySelector('[data-ap-habit]');
    poserDesign(0);

    if (ILLUSTRATION) {
      var img = document.querySelector('[data-ap-illustration] img');
      img.src = ILLUSTRATION.src; img.srcset = ILLUSTRATION.srcset; img.alt = ILLUSTRATION.alt;
    }
  }

  function motion() {
    if (!window.gsap) return;
    var mm = gsap.matchMedia();
    mm.add({ animer: '(prefers-reduced-motion: no-preference)', large: '(min-width: 64rem)' }, function (ctx) {
      var c = ctx.conditions;
      if (!c.animer) return;
      var racine = document.documentElement;
      racine.classList.add('ngs-motion');
      var nettoyer = 'transform,opacity,visibility';
      var splits = [];

      /* Lenis : défilement doux, synchronisé avec ScrollTrigger (comme sur l'accueil). */
      var lenis = null, tick = null;
      if (window.Lenis) {
        lenis = new Lenis({ autoRaf: false, anchors: { offset: -80 }, prevent: function (n) { return n.closest && n.closest('pre, dialog, .ngs-menu'); } });
        lenis.on('scroll', ScrollTrigger.update);
        tick = function (t) { lenis.raf(t * 1000); };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      /* 1. Hero : mots qui basculent en place, pièces qui arrivent de loin et s'assemblent. */
      var h1 = document.getElementById('apropos-titre');
      var sh = SplitText.create(h1, { type: 'words', mask: 'words' });
      splits.push(sh);
      var pieces = gsap.utils.toArray('[data-ap-piece]');
      var faits = gsap.utils.toArray('[data-ap-fait]');
      gsap.set(pieces.concat(faits), { autoAlpha: 0 });
      var tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tl.from(sh.words, { yPercent: 115, rotate: 8, transformOrigin: '0% 100%', duration: 1, stagger: 0.06 })
        .fromTo('[data-ap-texte] > :not(h1)', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, clearProps: nettoyer }, 0.35);
      pieces.forEach(function (p, i) {
        var d = (p.dataset.depart || '0,0').split(',').map(Number);
        var f = c.large ? 1 : 0.25; // sur mobile, des départs plus courts
        tl.fromTo(p, { x: d[0] * f, y: d[1] * f, rotation: (i % 2 ? 1 : -1) * 22, scale: 0.7, autoAlpha: 0 },
          { x: 0, y: 0, rotation: c.large ? Number(p.dataset.rotation || 0) : 0, scale: 1, autoAlpha: 1, duration: 1.3, ease: 'expo.out', clearProps: 'opacity,visibility' }, 0.15 + i * 0.09);
      });
      tl.fromTo(faits, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'expo.out', clearProps: 'opacity,visibility' }, 1.1)
        .fromTo('[data-ap-piece] .ap-piece__etiquette', { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, stagger: 0.06, clearProps: nettoyer }, 1.25);
      (NGS.splashFini || Promise.resolve()).then(function () { tl.play(); });
      var flottants = pieces.concat(faits);
      if (c.large) {
        // Pointeur (souris uniquement) : chaque pièce flotte selon sa profondeur, sans jamais remplacer le curseur.
        if (NGS.motion.pointeurFin) {
          var zone = document.querySelector('[data-ap-apesanteur]');
          var suiveurs = flottants.map(function (el) {
            return { p: Number(el.dataset.profondeur || 10), x: gsap.quickTo(el, 'xPercent', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(el, 'yPercent', { duration: 0.9, ease: 'power3.out' }) };
          });
          var hero = document.querySelector('.ap-hero');
          hero.addEventListener('pointermove', function (ev) {
            var r = zone.getBoundingClientRect();
            var dx = (ev.clientX - r.left) / r.width - 0.5, dy = (ev.clientY - r.top) / r.height - 0.5;
            suiveurs.forEach(function (s) { s.x(dx * s.p * 0.6); s.y(dy * s.p * 0.6); });
          });
          hero.addEventListener('pointerleave', function () { suiveurs.forEach(function (s) { s.x(0); s.y(0); }); });
        }
        // Scroll : les pièces se démontent en quittant l'écran (chacune dans sa direction).
        flottants.forEach(function (el, i) {
          var p = Number(el.dataset.profondeur || 10);
          gsap.to(el, { y: -p * 9, rotation: '+=' + ((i % 2 ? 1 : -1) * p * 0.5), ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: '.ap-hero', start: 'top top', end: 'bottom top', scrub: 0.7 } });
        });
      }

      /* 2. Chiffres : tuiles, compteurs et visuels, une fois à l'entrée. */
      var tuiles = gsap.utils.toArray('[data-ap-tuile]');
      gsap.set(tuiles, { clipPath: 'inset(100% 0% 0% 0% round 20px)' });
      var tc = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tc.to(tuiles, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1, ease: 'expo.inOut', stagger: 0.1, clearProps: 'clipPath' }, 0);
      document.querySelectorAll('[data-compte]').forEach(function (s, i) {
        var o = { v: 0 }, fin = Number(s.textContent);
        tc.fromTo(o, { v: 0 }, { v: fin, duration: fin > 3 ? 1.6 : 0.9, ease: 'power2.out', onUpdate: function () { s.textContent = String(Math.round(o.v)); } }, 0.3 + i * 0.1);
      });
      tc.from('[data-ap-carres] > span', { scale: 0, autoAlpha: 0, duration: 0.5, stagger: 0.07, ease: 'expo.out', clearProps: 'opacity,visibility,transform' }, 0.45)
        .from('[data-ap-legende] > span', { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.08, clearProps: nettoyer }, 1.3);
      gsap.utils.toArray('[data-ap-jetons] > li').forEach(function (j, i) {
        tc.call(function () { j.classList.add('is-on'); }, null, 0.5 + i * 0.08);
      });
      tc.from('[data-ap-pastilles] > span', { y: 30, rotation: -12, autoAlpha: 0, duration: 0.8, stagger: 0.1, clearProps: nettoyer }, 0.6)
        .to('[data-ap-curseur]', { xPercent: 100, duration: 0.5, ease: 'power3.inOut' }, 1.1)
        .to('[data-ap-curseur]', { xPercent: 0, duration: 0.5, ease: 'power3.inOut' }, 1.9)
        .fromTo('[data-ap-rature]', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, 1.2);
      ScrollTrigger.create({ trigger: '[data-ap-tuiles]', start: 'top 80%', once: true, onEnter: function () { tc.play(); } });

      /* 2 bis. Pour qui (v0.7) : manifeste lu mot à mot, code « avant » rayé, calendrier « après ». */
      var pq = document.querySelector('[data-ap-pourqui]');
      var sm = SplitText.create('[data-ap-manifeste]', { type: 'words' });
      splits.push(sm);
      var todos = gsap.utils.toArray('[data-ap-todo]');
      var avant = document.querySelector('[data-ap-avant]');
      var apres = document.querySelector('[data-ap-apres]');
      var tp = gsap.timeline({ defaults: { ease: 'none' }, paused: !c.large });
      gsap.set(sm.words, { opacity: 0.16 });
      gsap.set(todos, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(apres, { autoAlpha: 0, y: 40 });
      // 1. On lit la phrase (gris → noir) pendant que le code « avant » s'écrit ligne à ligne.
      tp.to(sm.words, { opacity: 1, stagger: 0.06, duration: 0.3 }, 0)
        .to(todos, { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.14, duration: 0.25 }, 0.1);
      // 2. Chaque « À faire » se raye : la pièce le fait déjà.
      todos.forEach(function (l, i) {
        var t0 = 1.15 + i * 0.12;
        tp.fromTo(l.querySelector('.ap-todo__texte'), { '--rature': '0%', opacity: 1 }, { '--rature': '100%', opacity: 0.55, duration: 0.18, ease: 'power2.inOut' }, t0)
          .fromTo(l.querySelector('.ap-todo__marque'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.15, ease: 'power2.out' }, t0 + 0.08);
      });
      // 3. Le code « avant » s'efface, le vrai calendrier prend sa place.
      // En desktop épinglé, l'avant laisse la place ; sur mobile, il reste au-dessus de l'après (empilés).
      if (c.large) tp.to(avant, { autoAlpha: 0, y: -30, scale: 0.97, duration: 0.3, ease: 'power2.in' }, 1.95);
      tp.to(apres, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, 2.25)
        .fromTo('[data-ap-apres-piece]', { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(-20% -20% -20% -20% round 20px)', duration: 0.45, ease: 'expo.out' }, 2.25)
        .to({}, { duration: 0.35 });
      if (c.large) {
        pq.classList.add('ap-pourqui--pin');
        // Créé avant « Trois gestes » dans le script mais placé après dans la page : refreshPriority 1 (après lui, avant les autres).
        ScrollTrigger.create({ trigger: pq, start: 'top top', end: '+=160%', pin: true, scrub: 0.8, anticipatePin: 1, animation: tp, invalidateOnRefresh: true, refreshPriority: 1 });
      } else {
        // Mobile : la séquence se joue une fois à l'entrée (rien d'épinglé) ; l'avant reste visible au-dessus de l'après.
        tp.timeScale(1.6);
        ScrollTrigger.create({ trigger: pq, start: 'top 65%', once: true, onEnter: function () { tp.play(); } });
      }

      /* 2 ter. Comment c'est fait : panneau qui se pose ; en desktop, le point actif suit la progression du scroll. */
      gsap.fromTo('[data-ap-panneau]', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: 'expo.out', clearProps: nettoyer, scrollTrigger: { trigger: '[data-ap-comment-scene]', start: 'top 75%', once: true } });
      if (c.large) {
        ScrollTrigger.create({ trigger: '[data-ap-comment]', start: 'top 55%', end: 'bottom 45%',
          onUpdate: function (s) { montrerPoint(Math.min(3, Math.floor(s.progress * 4)), true); } });
      }

      /* 3. Moment fort : copier, régler, livrer. */
      var section = document.querySelector('[data-ap-gestes]');
      var vues = gsap.utils.toArray('[data-ap-vue]');
      var noms = gsap.utils.toArray('[data-ap-etape] .ap-etape__nom');
      var textes = gsap.utils.toArray('[data-ap-etape] .ap-etape__texte');
      if (c.large) {
        section.classList.add('ap-gestes--pin');
        gsap.set(vues.slice(1), { clipPath: 'inset(100% 0% 0% 0% round 14px)' });
        gsap.set(noms[0], { '--wght': 800, opacity: 1 });
        gsap.set(noms.slice(1), { '--wght': 460, opacity: 0.4 });
        gsap.set(textes.slice(1), { opacity: 0.4 });
        var tg = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            // refreshPriority : cet épinglage est plus haut dans la page que « Pour qui », il est calculé en premier.
            trigger: section, start: 'top top', end: '+=220%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
            onUpdate: function (s) {
              // Pendant « Régler », la scène passe de Planche à Fleuve puis à Latérite.
              var p = s.progress;
              poserDesign(p < 0.39 ? 0 : p < 0.5 ? 1 : 2);
            }
          }
        });
        tg.to('[data-ap-progression]', { scaleY: 1, duration: 3 }, 0);
        [1, 2].forEach(function (i) {
          var t0 = i - 0.15;
          tg.to(noms[i - 1], { '--wght': 460, opacity: 0.4, duration: 0.3 }, t0)
            .to(textes[i - 1], { opacity: 0.4, duration: 0.3 }, t0)
            .to(noms[i], { '--wght': 800, opacity: 1, duration: 0.3 }, t0)
            .to(textes[i], { opacity: 1, duration: 0.3 }, t0)
            .to(vues[i], { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.4, ease: 'power2.inOut' }, t0)
            .fromTo(vues[i - 1], { scale: 1 }, { scale: 0.96, autoAlpha: 0.3, duration: 0.4, ease: 'power2.inOut' }, t0);
        });
        tg.from('[data-ap-zip] li', { x: -14, autoAlpha: 0, stagger: 0.04, duration: 0.2 }, 2.1)
          .to({}, { duration: 0.6 });
      } else {
        // Empilé : chaque vue se révèle à son entrée ; les designs changent en traversant « Régler ».
        vues.forEach(function (v) {
          gsap.fromTo(v, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.9, ease: 'expo.out', clearProps: 'clipPath', scrollTrigger: { trigger: v, start: 'top 85%', once: true } });
        });
        ScrollTrigger.create({ trigger: vues[1], start: 'top 70%', end: 'bottom 30%', onUpdate: function (s) { poserDesign(Math.min(2, Math.floor(s.progress * 3))); } });
      }

      /* 4. Titres de section : mots qui montent depuis un masque. */
      gsap.utils.toArray('.ap-titre').forEach(function (el) {
        if (el === h1) return;
        var s = SplitText.create(el, { type: 'words', mask: 'words' });
        splits.push(s);
        gsap.from(s.words, { yPercent: 105, duration: 0.8, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });
      ScrollTrigger.batch('[data-ap-promesses] > div, [data-ap-points] > li', {
        start: 'top 88%', once: true,
        onEnter: function (els) { gsap.fromTo(els, { x: -16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.07, duration: 0.7, ease: 'expo.out', clearProps: nettoyer }); }
      });

      /* 5. Photos : révélation en masque, puis parallaxe dans le cadre. */
      gsap.utils.toArray('[data-ap-revele]').forEach(function (f, i) {
        var img = f.querySelector('img');
        gsap.timeline({ scrollTrigger: { trigger: f, start: 'top 82%', once: true } })
          .to(f, { clipPath: 'inset(0% 0 0 0 round 20px)', duration: 1.1, ease: 'expo.inOut', delay: i * 0.12 })
          .from(img, { scale: 1.2, duration: 1.4, ease: 'expo.out', clearProps: 'scale' }, '<0.1');
        if (c.large) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });

      /* 5 bis. Contribuer : les lignes du dossier puis les étapes du parcours arrivent en cascade. */
      gsap.timeline({ scrollTrigger: { trigger: '[data-ap-dossier]', start: 'top 80%', once: true }, defaults: { ease: 'expo.out' } })
        .fromTo('[data-ap-dossier] .ngs-code', { clipPath: 'inset(0% 0% 100% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' })
        .fromTo('[data-ap-arbre-ligne]', { x: -12, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, clearProps: nettoyer }, '-=0.35')
        .fromTo('[data-ap-parcours] > li', { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08, clearProps: nettoyer }, '-=0.3');

      /* 6. Qui le développe. */
      var cadre = document.querySelector('[data-ap-portrait-cadre]');
      var nom = document.querySelector('[data-ap-nom]');
      var sn = SplitText.create(nom, { type: 'chars,words', mask: 'words' });
      splits.push(sn);
      gsap.timeline({ scrollTrigger: { trigger: '[data-ap-portrait]', start: 'top 78%', once: true }, defaults: { ease: 'expo.out' } })
        .fromTo(cadre, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' })
        .from('[data-ap-portrait-img]', { scale: 1.18, duration: 1.6, clearProps: 'scale' }, '<0.15')
        .from('[data-ap-marque] > span', { scale: 0.3, autoAlpha: 0, duration: 0.6, stagger: 0.07, clearProps: 'opacity,visibility,scale' }, '-=1.0')
        .from(sn.chars, { yPercent: 110, duration: 0.8, stagger: 0.025 }, '-=1.1')
        .fromTo('[data-ap-liens] > li', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, clearProps: nettoyer }, '-=0.7');
      if (c.large) gsap.fromTo('[data-ap-portrait-img]', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: cadre, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });

      ScrollTrigger.refresh();
      return function () {
        racine.classList.remove('ngs-motion');
        section.classList.remove('ap-gestes--pin');
        splits.forEach(function (s) { s.revert(); });
        if (lenis) { gsap.ticker.remove(tick); lenis.destroy(); }
        poserDesign(0);
      };
    });
  }

  NGS.pret.then(function () {
    contenu();
    requestAnimationFrame(motion);
  });
  // Les polices et les images changent les hauteurs : on recalcule les déclencheurs une fois tout chargé.
  addEventListener('load', function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
