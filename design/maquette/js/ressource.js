/*
  Fiche ressource : aperçu live isolé (iframe sandbox, ADR 0003) dans la variante de code choisie
  (Tailwind par défaut, ou CSS), réglages par tokens en groupes repliables, code par fichier, copier,
  télécharger (le zip suit la variante). Choix de variante gardé dans un cookie fonctionnel (ADR 0002).
*/
(function () {
  var NGS = window.NGS;
  var slug = new URLSearchParams(location.search).get('r') || 'calendrier';
  var res = NGS.trouver(slug);

  var POLICES = {
    systeme: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    arrondie: 'ui-rounded, system-ui, sans-serif',
    serif: 'ui-serif, Georgia, "Times New Roman", serif'
  };
  var COULEURS = [
    { id: 'design', couleur: null },
    { id: 'bleu', couleur: '#1f4fd1' },
    { id: 'vert', couleur: '#0b6e4f' },
    { id: 'framboise', couleur: '#b0005e' },
    { id: 'ambre', couleur: '#8a5300' }
  ];
  function lireCookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : null; }

  var etat = {
    design: res && res.design ? res.design : 'planche',
    // L'aperçu démarre dans le thème du site, puis se règle indépendamment (segment Clair / Sombre).
    mode: NGS.theme ? NGS.theme.mode() : 'clair',
    animations: true,
    largeur: 'auto',
    variante: lireCookie('ngs_variante') === 'css' ? 'css' : 'tailwind',
    s: {}
  };
  var iframe, cadre, stage, codeAvant = {};

  function surcharges() {
    var s = etat.s;
    return {
      '--ngs-color-action': s.couleur || null,
      '--ngs-radius': s.rayon != null ? s.rayon + 'px' : null,
      '--ngs-density': s.densite != null ? String(s.densite) : null,
      '--ngs-font-family': s.police ? POLICES[s.police] : null
    };
  }
  function valeurs() { return NGS.contrat.valeurs(etat.design, etat.mode, surcharges()); }

  /* ---------- Aperçu (iframe sandbox) ---------- */
  function srcdoc() {
    var slugs = res.composition || [res.slug];
    var compo = !!res.composition;
    var tw = etat.variante === 'tailwind';
    var corps, tete = '';
    if (tw) {
      corps = slugs.map(function (s) { return '<div data-piece="' + s + '">' + NGS.demoTailwind(NGS.trouver(s)) + '</div>'; }).join('');
      var images = slugs.map(function (s) { return NGS.trouver(s).keyframesTailwind || ''; }).join('\n');
      // Le CSS Tailwind est posé dans un <script type="text/plain"> puis injecté en <style type="text/tailwindcss"> par script :
      // un <style> écrit dans le HTML du srcdoc déclenchait la requête 404 de l'@import "tailwindcss".
      var cssTw = '@import "tailwindcss";\n' + NGS.contrat.themeTailwind() + '\n' +
        NGS.contrat.fichier(res.titre, etat.design, {}, NGS.site.nom).replace(/\.dark \{[\s\S]*$/, '') + '\n' + images;
      tete = '<script type="text/plain" id="ngs-tw">' + cssTw.replace(/<\/script/gi, '<\\/script') + '<\/script>' +
        '<script>var st=document.createElement("style");st.type="text/tailwindcss";st.textContent=document.getElementById("ngs-tw").textContent;document.head.appendChild(st);' +
        'var sc=document.createElement("script");sc.src="' + NGS.site.chemins.tailwindNavigateur + '";document.head.appendChild(sc);<\/script>';
    } else {
      corps = slugs.map(function (s) { return '<ngs-apercu ressource="' + s + '"></ngs-apercu>'; }).join('');
    }
    var sansAnim = !etat.animations || NGS.motion.reduit;
    return '<!doctype html><html lang="fr"' + (sansAnim ? ' class="ngs-sans-animation"' : '') + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + tete + '<style>' +
      'html{background:var(--ngs-color-surface,#fff);color:var(--ngs-color-text,#0b0b0c);transition:background-color .25s ease-out;color-scheme:light}' +
      'html.dark{color-scheme:dark}' +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px 20px;box-sizing:border-box;font-family:var(--ngs-font-family,system-ui)}' +
      // Version Tailwind : chaque pièce occupe toute la largeur de la grille. Sans cela, un hôte « @container »
      // (container-type: inline-size, sans largeur intrinsèque) dans un élément ajusté à son contenu retombe
      // à 0 px de large (bug de la carte de séjour, v0.5).
      '[data-piece]{width:100%;min-width:0;display:grid;justify-items:center}' +
      '.compo{display:grid;gap:28px;width:min(100%,' + (compo ? '24rem' : (res.famille === 'blocs' ? '64rem' : '44rem')) + ');justify-items:' + (compo || res.famille === 'blocs' ? 'stretch' : 'center') + '}' +
      '</style></head><body>' + (tw && res.motion && res.motion.rejouer && res.motion.rejouer.sortie ? '<div hidden class="' + NGS.cls(res, 'tailwind')(res.motion.rejouer.sortie) + '"></div>' : '') + '<div class="compo">' + corps.replace(/<ngs-apercu /g, '<ngs-apercu' + (sansAnim ? ' class="ngs-sans-animation"' : '') + ' ') + '</div>' +
      '<script src="js/registre.js"><\/script><script src="js/variantes.js"><\/script><script src="js/apercu.js"><\/script><script>' +
      (tw ? 'document.querySelectorAll("[data-piece]").forEach(function(p){var r=NGS.trouver(p.dataset.piece);if(r.init)r.init(p,NGS.cls(r,"tailwind"));});' : '') +
      'addEventListener("message",function(e){var d=e.data;if(!d||d.type!=="ngs-reglages")return;' +
      'Object.keys(d.vars).forEach(function(k){document.documentElement.style.setProperty(k,d.vars[k])});' +
      'document.documentElement.classList.toggle("dark",d.mode==="sombre");' +
      // Réglage « Animations » : classe .ngs-sans-animation sur la page (Tailwind : variante in-[…]) et sur chaque hôte (CSS : :host(…)).
      'var off=d.animations===false;document.documentElement.classList.toggle("ngs-sans-animation",off);' +
      'document.querySelectorAll("ngs-apercu").forEach(function(h){h.classList.toggle("ngs-sans-animation",off)})});' +
      // « Rejouer la sortie » : la classe de sortie est posée sur l'hôte (ngs-apercu en CSS, enveloppe en Tailwind),
      // comme le ferait animate.leave ; à la fin, la page parente recharge l'aperçu (l'entrée se rejoue).
      'addEventListener("message",function(e){var d=e.data;if(!d||d.type!=="ngs-sortie")return;' +
      'var hotes=document.querySelectorAll("ngs-apercu, [data-piece] > div");var fini=false;' +
      'function fin(){if(fini)return;fini=true;parent.postMessage({type:"ngs-sortie-fin"},"*")}' +
      'hotes.forEach(function(h){d.classes.split(" ").forEach(function(c){h.classList.add(c)});h.addEventListener("animationend",fin,{once:true})});' +
      'setTimeout(function(){var a=hotes[0]&&getComputedStyle(hotes[0]).animationName;if(!a||a==="none")fin()},80);setTimeout(fin,1200)});' +
      'parent.postMessage({type:"ngs-pret"},"*");<\/script></body></html>';
  }
  function envoyer() {
    if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'ngs-reglages', vars: valeurs(), mode: etat.mode, animations: etat.animations && !NGS.motion.reduit }, '*');
  }
  function ajuster() {
    var dispo = cadre.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(cadre).top);
    var H = cadre.clientHeight;
    var w = etat.largeur === 'auto' ? dispo : Number(etat.largeur);
    var s = Math.min(1, dispo / w);
    cadre.style.width = Math.round(w * s) + 'px';
    iframe.style.width = Math.max(0, w - 2) + 'px';
    iframe.style.height = Math.max(0, Math.round(H / s) - 2) + 'px';
    iframe.style.transform = s < 1 ? 'scale(' + s + ')' : 'none';
  }
  function chargerApercu() {
    iframe.srcdoc = srcdoc();
  }
  function construireApercu() {
    stage = document.querySelector('[data-stage]');
    cadre = document.querySelector('[data-cadre]');
    iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', NGS.t('ressource.apercu.iframe', { titre: res.titre }));
    cadre.appendChild(iframe);
    addEventListener('message', function (e) {
      if (e.source !== iframe.contentWindow || !e.data) return;
      if (e.data.type === 'ngs-pret') envoyer();
      if (e.data.type === 'ngs-sortie-fin') setTimeout(chargerApercu, 450);
    });
    construireRejouer();
    new ResizeObserver(ajuster).observe(stage);
    chargerApercu();
    ajuster();
  }

  /* ---------- Rejouer l'entrée / la sortie (ressources dont motion.rejouer est renseigné) ---------- */
  function construireRejouer() {
    var r = res.motion && res.motion.rejouer;
    var zone = document.querySelector('[data-rejouer]');
    if (!r) return;
    zone.hidden = false;
    var be = zone.querySelector('[data-rejouer-entree]');
    var bs = zone.querySelector('[data-rejouer-sortie]');
    be.hidden = !r.entree;
    bs.hidden = !r.sortie;
    be.addEventListener('click', chargerApercu);
    bs.addEventListener('click', function () {
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'ngs-sortie', classes: NGS.cls(res, etat.variante)(r.sortie) }, '*');
    });
    majRejouer();
  }
  /** Animations coupées (réglage ou système) : rien à rejouer, les boutons sont désactivés. */
  function majRejouer() {
    var off = !etat.animations || NGS.motion.reduit;
    document.querySelectorAll('[data-rejouer] button').forEach(function (b) { b.disabled = off; });
  }

  /* ---------- Réglages ---------- */
  var rDesign, rDensite, rPolice, rCouleur, rayon, rayonSortie, contraste;
  function synchroniserControles() {
    var v = valeurs();
    rDesign.poser(etat.design);
    rDensite.poser(Number(v['--ngs-density']));
    var p = Object.keys(POLICES).filter(function (k) { return POLICES[k] === v['--ngs-font-family']; })[0] || 'systeme';
    rPolice.poser(p);
    rayon.value = parseInt(v['--ngs-radius'], 10);
    rayonSortie.textContent = rayon.value + ' px';
    var themeAction = NGS.contrat.valeurs(etat.design, 'clair')['--ngs-color-action'];
    document.querySelector('[data-r-couleur] [data-valeur="design"]').style.setProperty('--sw', themeAction);
    var choix = etat.s.couleur ? (COULEURS.filter(function (c) { return c.couleur === etat.s.couleur; })[0] || { id: 'perso' }).id : 'design';
    rCouleur.poser(choix);
    // Valeurs résumées dans les en-têtes des groupes repliés.
    var d = NGS.trouver(etat.design);
    document.querySelector('[data-v-design]').textContent = d ? d.nomDesign : etat.design;
    document.querySelector('[data-v-couleur]').innerHTML = '<i style="background:' + v['--ngs-color-action'] + '"></i>' + v['--ngs-color-action'];
    document.querySelector('[data-v-rayon]').textContent = rayon.value + ' px';
    document.querySelector('[data-v-densite]').textContent = document.querySelector('[data-r-densite] [aria-checked="true"]') ? document.querySelector('[data-r-densite] [aria-checked="true"]').textContent : v['--ngs-density'];
    document.querySelector('[data-v-police]').textContent = document.querySelector('[data-r-police] [data-valeur="' + p + '"]').textContent;
    document.querySelector('[data-v-animations]').textContent = NGS.t('ressource.reglages.animations.' + (!res.motion ? 'aucune' : etat.animations ? 'on' : 'off'));
    var r = NGS.contrat.contraste(v['--ngs-color-action'], v['--ngs-color-on-action']);
    var ok = r >= 4.5;
    contraste.className = 'ngs-contrast m-0 ' + (ok ? 'ngs-contrast--ok' : 'ngs-contrast--ko');
    contraste.innerHTML = NGS.icone(ok ? 'check-circle' : 'warning-circle', 'ngs-icon--sm') +
      '<span>' + NGS.t('ressource.contraste', { r: r.toFixed(1).replace('.', ',') }) + ', ' + NGS.t(ok ? 'ressource.contraste.ok' : 'ressource.contraste.ko') + '</span>';
  }
  function changer() {
    synchroniserControles();
    envoyer();
    rendreTokens(true);
  }
  function construireReglages() {
    var sw = document.querySelector('[data-r-couleur]');
    sw.innerHTML = COULEURS.map(function (c) {
      return '<button class="ngs-swatch" type="button" role="radio" aria-checked="false" data-valeur="' + c.id + '" style="--sw:' + (c.couleur || 'transparent') + '" aria-label="' +
        NGS.t(c.id === 'design' ? 'ressource.reglages.couleur.design' : 'ressource.reglages.couleur.' + c.id) + '"></button>';
    }).join('') +
      '<label class="ngs-swatch ngs-swatch--custom" role="radio" aria-checked="false" data-valeur="perso"><span class="sr-only">' + NGS.t('ressource.reglages.couleur.perso') + '</span><input type="color" value="#1f4fd1" data-couleur-perso></label>';
    rCouleur = NGS.radio(sw, function (b) {
      if (b.dataset.valeur === 'perso') return; // le label ouvre le sélecteur natif
      etat.s.couleur = COULEURS.filter(function (x) { return x.id === b.dataset.valeur; })[0].couleur;
      changer();
    });
    sw.querySelector('[data-couleur-perso]').addEventListener('input', function (e) { etat.s.couleur = e.target.value; changer(); });

    rDesign = NGS.radio(document.querySelector('[data-r-design]'), function (b) { etat.design = b.dataset.valeur; etat.s = {}; changer(); });
    rDensite = NGS.radio(document.querySelector('[data-r-densite]'), function (b) { etat.s.densite = Number(b.dataset.valeur); changer(); });
    rPolice = NGS.radio(document.querySelector('[data-r-police]'), function (b) { etat.s.police = b.dataset.valeur; changer(); });
    rayon = document.querySelector('[data-r-rayon]');
    rayonSortie = document.querySelector('[data-r-rayon-sortie]');
    rayon.addEventListener('input', function () { etat.s.rayon = Number(rayon.value); changer(); });
    contraste = document.querySelector('[data-contraste]');
    document.querySelector('[data-reinitialiser]').addEventListener('click', function () {
      etat.s = {}; etat.design = res.design || 'planche'; changer();
      var a = document.querySelector('[data-r-animations]');
      if (res.motion && !etat.animations) { etat.animations = true; a.checked = true; synchroniserControles(); rendreUsage(); chargerApercu(); }
      NGS.toast(NGS.t('ressource.reglages.reinitialises'));
    });

    var rMode = NGS.radio(document.querySelector('[data-modes]'), function (b) { etat.mode = b.dataset.valeur; changer(); });
    rMode.poser(etat.mode);

    /* Animations propres de la ressource (registre : champ motion) : activées par défaut, coupables ici. */
    var anim = document.querySelector('[data-r-animations]');
    var aideAnim = document.querySelector('[data-r-animations-aide]');
    if (!res.motion) {
      anim.checked = false; anim.disabled = true;
      aideAnim.textContent = NGS.t('ressource.reglages.animations.sans');
    } else {
      aideAnim.textContent = res.motion.resume + ' ' + NGS.t(NGS.motion.reduit ? 'ressource.reglages.animations.reduit' : 'ressource.reglages.animations.aide');
      anim.addEventListener('change', function () {
        etat.animations = anim.checked;
        majRejouer();
        synchroniserControles();
        rendreUsage();
        // L'aperçu est rechargé : les animations d'entrée se rejouent (ou non) sous le nouveau réglage.
        chargerApercu();
      });
    }
    NGS.radio(document.querySelector('[data-tailles]'), function (b) {
      etat.largeur = b.dataset.valeur;
      if (window.gsap && !NGS.motion.reduit) {
        gsap.to(iframe, { opacity: 0, duration: 0.1, onComplete: function () { ajuster(); gsap.to(iframe, { opacity: 1, duration: 0.2 }); } });
      } else ajuster();
    });
    synchroniserControles();
  }

  /* ---------- Code : variante, onglets par fichier ---------- */
  var onglets, panneaux, fichierActif = 0, ongletsCtl;
  function fichiers() { return NGS.fichiersRessource(res, etat.design, surcharges(), etat.variante); }
  function rendreTokens(signaler) {
    var f = fichiers().filter(function (x) { return x.nom === 'tokens.css'; })[0];
    var pre = panneaux.querySelector('[data-fichier="tokens.css"] code');
    if (!pre || !f) return;
    var brut = f.code.split('\n');
    var avant = codeAvant['tokens.css'] || brut;
    var html = NGS.surligner(f.code, 'css').split('\n');
    pre.innerHTML = html.map(function (l, i) {
      var neuve = signaler && brut[i] !== avant[i];
      return '<span class="block' + (neuve ? ' ngs-code__line--new' : '') + '">' + (l || ' ') + '</span>';
    }).join('');
    codeAvant['tokens.css'] = brut;
    if (signaler) {
      var point = onglets.querySelector('[data-point]');
      if (point) {
        point.classList.add('is-on');
        clearTimeout(point._t);
        point._t = setTimeout(function () { point.classList.remove('is-on'); }, 1600);
      }
      pre.querySelectorAll('.ngs-code__line--new').forEach(function (l) {
        if (window.gsap && !NGS.motion.reduit) gsap.to(l, { backgroundColor: 'transparent', boxShadow: 'inset 0 0 0 transparent', duration: 1.2, delay: 0.6, clearProps: 'all', onComplete: function () { l.classList.remove('ngs-code__line--new'); } });
        else setTimeout(function () { l.classList.remove('ngs-code__line--new'); }, 1500);
      });
    }
  }
  function rendreCode() {
    var f = fichiers();
    fichierActif = Math.min(fichierActif, f.length - 1);
    codeAvant = {};
    onglets.innerHTML = f.map(function (x, i) {
      return '<button class="ngs-tabs__tab" type="button" role="tab" id="onglet-' + i + '" aria-controls="panneau-' + i + '" aria-selected="' + (i === fichierActif) + '">' + x.nom +
        (x.nom === 'tokens.css' ? '<span class="onglet-point" data-point aria-hidden="true"></span>' : '') + '</button>';
    }).join('') + '<span class="ngs-tabs__indicator" aria-hidden="true"></span>';
    panneaux.innerHTML = f.map(function (x, i) {
      return '<div role="tabpanel" id="panneau-' + i + '" aria-labelledby="onglet-' + i + '" data-fichier="' + x.nom + '"' + (i === fichierActif ? '' : ' hidden') + '><pre tabindex="0"><code>' +
        (x.nom === 'tokens.css' ? '' : NGS.surligner(x.code, x.langage)) + '</code></pre></div>';
    }).join('');
    rendreTokens(false);
    ongletsCtl = NGS.onglets(onglets, function (tab) { fichierActif = Number(tab.id.split('-')[1]); });
    document.querySelector('[data-variante-aide]').textContent = NGS.t('code.variante.aide.' + etat.variante);
    document.querySelector('[data-variante-note]').textContent = NGS.t('code.variante') + ' : ' + NGS.t('code.variante.' + etat.variante);
    rendreUsage();
    var etapes = document.querySelector('[data-etapes]');
    if (etapes) {
      etapes.innerHTML = NGS.t('zip.installation.' + etat.variante, { slug: res.slug }).split('\n').map(function (l) {
        return '<li>' + l.replace(/^\d+\.\s*/, '').replace(/`([^`]+)`/g, '<code>$1</code>') + '</li>';
      }).join('');
    }
  }
  /** Bloc « Utilisation » : reprend le réglage Animations ([animations]="false" sur la balise du composant). */
  function rendreUsage() {
    var code = res.usage;
    if (res.motion && !etat.animations) {
      code = code.replace(/<(ngs-[\w-]+)([\s\S]*?)(\s*)\/>/, function (m, tag, attrs, esp) {
        return attrs.indexOf('\n') >= 0 ? '<' + tag + attrs + '\n  [animations]="false"\n/>' : '<' + tag + attrs + ' [animations]="false" />';
      });
    }
    document.querySelector('[data-usage]').innerHTML = NGS.surligner(code, /^\/\/|^\/\*/.test(code) ? (res.famille === 'designs' ? 'css' : 'ts') : 'html');
  }
  function construireCode() {
    onglets = document.querySelector('[data-onglets]');
    panneaux = document.querySelector('[data-panneaux]');
    var groupe = document.querySelector('[data-variantes]');
    var ctl = NGS.radio(groupe, function (b) {
      if (etat.variante === b.dataset.valeur) return;
      etat.variante = b.dataset.valeur;
      document.cookie = 'ngs_variante=' + etat.variante + '; Max-Age=31536000; Path=/; SameSite=Lax';
      rendreCode();
      chargerApercu();
      if (window.gsap && !NGS.motion.reduit) gsap.from('[data-panneaux]', { autoAlpha: 0, y: 6, duration: 0.3 });
    });
    ctl.poser(etat.variante);
    rendreCode();
    var bouton = document.querySelector('[data-copier-fichier]');
    bouton.addEventListener('click', function () {
      var x = fichiers()[fichierActif];
      NGS.copier(x.code, bouton, NGS.t('ressource.toast.copie.fichier', { fichier: x.nom }));
    });
  }

  /* ---------- Identité, actions, méta ---------- */
  function construireFiche() {
    document.title = res.titre + ' — ' + NGS.site.nom;
    document.querySelector('[data-titre]').textContent = res.titre;
    document.querySelector('[data-description]').textContent = res.description;
    document.querySelector('[data-badges]').innerHTML = NGS.badgesHTML(res, { reglable: true, provisoire: true });
    // Fil d'Ariane : préfigure la route /<categorie>/<type>/<slug> (ADR 0004).
    var fil = '<li><a class="ngs-link" href="catalogue.html?c=' + res.famille + '">' + NGS.t('cat.' + res.famille) + '</a></li>';
    if (res.type && NGS.libelleType(res.type) !== res.titre) fil += '<li><a class="ngs-link" href="catalogue.html?c=' + res.famille + '&type=' + res.type + '">' + NGS.libelleType(res.type) + '</a></li>';
    document.querySelector('[data-fil]').insertAdjacentHTML('beforeend', fil + '<li aria-current="page">' + res.titre + '</li>');
    document.querySelectorAll('[data-nav]').forEach(function (a) { if (a.dataset.nav === res.famille) a.setAttribute('aria-current', 'page'); });

    var date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(res.ajout));
    var meta = '';
    if (res.type) meta += '<dt>' + NGS.t('ressource.type') + '</dt><dd>' + NGS.libelleType(res.type) + '</dd>';
    if (res.secteurs.length) meta += '<dt>' + NGS.t('ressource.secteur') + '</dt><dd>' + res.secteurs.map(NGS.libelleSecteur).join(', ') + '</dd>';
    meta += '<dt>' + NGS.t('ressource.meta.angular') + '</dt><dd>' + NGS.t('ressource.meta.angular.valeur', { v: res.angularVersion }) + '</dd>' +
      '<dt>' + NGS.t('ressource.meta.licence') + '</dt><dd>MIT</dd>' +
      '<dt>' + NGS.t('ressource.meta.ajout') + '</dt><dd>' + date + '</dd>';
    if (res.famille !== 'designs') {
      meta += '<dt>' + NGS.t('ressource.meta.animations') + '</dt><dd>' + (res.motion
        ? NGS.t('ressource.meta.animations.valeur', { moments: res.motion.moments.map(function (m) { return NGS.t('motion.moment.' + m); }).join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) })
        : NGS.t('ressource.meta.animations.aucune')) + '</dd>';
    }
    document.querySelector('[data-meta]').innerHTML = meta;
    document.querySelector('[data-dependances]').textContent = NGS.t('ressource.dependances.aucune', { v: res.angularVersion });

    var estDesign = res.famille === 'designs';
    document.querySelector('[data-libelle-telecharger]').textContent = NGS.t(estDesign ? 'ressource.telecharger.design' : 'ressource.telecharger');
    var bt = document.querySelector('[data-copier-tout]');
    bt.addEventListener('click', function () { NGS.copier(NGS.toutLeCode(res, etat.design, surcharges(), etat.variante), bt); });
    var bz = document.querySelector('[data-telecharger]');
    bz.addEventListener('click', function () {
      bz.classList.add('is-loading');
      setTimeout(function () {
        var z = NGS.zipRessource(res, etat.design, surcharges(), etat.variante);
        NGS.telechargerBlob(z.blob, z.nom);
        bz.classList.remove('is-loading');
        bz.classList.add('is-done');
        setTimeout(function () { bz.classList.remove('is-done'); }, 2200);
        NGS.toast(NGS.t('ressource.toast.zip', { fichier: z.nom }));
      }, 350);
    });

    if (estDesign) {
      document.querySelector('[data-api-section]').hidden = true;
    } else {
      document.querySelector('[data-api] tbody').innerHTML = res.api.map(function (a) {
        return '<tr><td><code>' + a.nom + '</code></td><td><code>' + a.type.replace(/</g, '&lt;') + '</code></td><td><code>' + a.defaut + '</code></td><td>' + a.role + '</td></tr>';
      }).join('');
    }

    var autres = NGS.registre.filter(function (r) { return r.slug !== res.slug && r.famille !== 'designs'; })
      .sort(function (a, b) { return (b.famille === res.famille) - (a.famille === res.famille); }).slice(0, 4);
    var zone = document.querySelector('[data-autres]');
    zone.innerHTML = autres.map(function (r) { return NGS.caseHTML(r, { taille: false }); }).join('');
    zone.querySelectorAll('.ngs-case').forEach(function (c) { NGS.habiller(c, 'planche'); });
  }

  function entree() {
    if (!window.gsap || NGS.motion.reduit) return;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    // Avec View Transitions, l'aperçu arrive par le morph de la case : on n'anime que le texte.
    var nettoyer = 'transform,opacity,visibility';
    if (!NGS.motion.vtDocument) tl.fromTo('[data-entree-apercu]', { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.6, clearProps: nettoyer });
    tl.fromTo('[data-entree] .fiche-identite__corps > * > *', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.5, clearProps: nettoyer }, 0.05)
      .fromTo('[data-reglages-panneau]', { x: 16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, clearProps: nettoyer }, 0.15);
    // Autres ressources : états finaux explicites + clearProps (aucune case ne reste décalée).
    var autres = gsap.utils.toArray('[data-autres] .ngs-case');
    gsap.set(autres, { y: 24, autoAlpha: 0 });
    ScrollTrigger.create({ trigger: '[data-autres]', start: 'top 85%', once: true, onEnter: function () {
      gsap.fromTo(autres, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: 'expo.out', clearProps: nettoyer });
    } });
  }

  NGS.pret.then(function () {
    if (!res) {
      document.querySelector('[data-fiche]').hidden = true;
      document.querySelector('[data-introuvable]').hidden = false;
      document.title = NGS.t('ressource.introuvable.titre') + ' — ' + NGS.site.nom;
      return;
    }
    construireFiche();
    construireApercu();
    construireReglages();
    construireCode();
    entree();
  });
})();
