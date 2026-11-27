/* Page de design system : rendus calculés depuis les variables CSS (aucune valeur recopiée). */
(function () {
  var NGS = window.NGS;
  function css(v, el) { return getComputedStyle(el || document.documentElement).getPropertyValue(v).trim(); }
  function hex(c) {
    // Normalise une couleur CSS calculée en #rrggbb.
    var cv = document.createElement('canvas').getContext('2d');
    cv.fillStyle = '#000'; cv.fillStyle = c; return cv.fillStyle;
  }
  function verdict(r, seuil) {
    return '<span class="' + (r >= seuil ? 'ds-ok' : 'ds-ko') + '">' + r.toFixed(2).replace('.', ',') + ':1</span>';
  }

  NGS.pret.then(function () {
    /* Couleurs + contrastes mesurés, dans le thème de la zone (le bloc « Mode sombre » est forcé en sombre). */
    function couleurs() {
      document.querySelectorAll('[data-couleurs]').forEach(function (g) {
        var zone = g.closest('[data-theme]') || document.documentElement;
        var blanc = hex(css('--color-canvas', zone));
        var surface = hex(css('--color-surface', zone));
        var fond = g.dataset.fond ? hex(css('--color-' + g.dataset.fond, zone)) : null;
        var nomFond = zone.getAttribute('data-theme') === 'sombre' ? 'sur canvas' : 'sur blanc';
        g.innerHTML = g.dataset.couleurs.split(' ').map(function (n) {
          var c = hex(css('--color-' + n, zone));
          var info;
          var decor = /^(canvas|surface|surface-hover|border|border-hover|code-bg|ring|toast-bg)$|-soft$/.test(n);
          var seuil = /border-strong|control-off|text-faint/.test(n) ? 3 : 4.5;
          if (decor) info = 'fond ou décor : jamais utilisé comme texte';
          else if (fond) info = 'sur fond de code ' + verdict(NGS.contrat.contraste(c, fond), 4.5);
          else if (n === 'on-cat') info = ['composants', 'blocs', 'templates', 'designs'].map(function (f) { return 'sur ' + f + ' ' + verdict(NGS.contrat.contraste(c, hex(css('--color-cat-' + f, zone))), 4.5); }).join('<br>');
          else if (n === 'on-primary') info = 'sur action ' + verdict(NGS.contrat.contraste(c, hex(css('--color-primary', zone))), 4.5);
          else if (n === 'toast-text') info = 'sur toast ' + verdict(NGS.contrat.contraste(c, hex(css('--color-toast-bg', zone))), 4.5);
          else {
            info = (seuil === 3 ? 'seuil 3:1 ' : '') + nomFond + ' ' + verdict(NGS.contrat.contraste(c, blanc), seuil) + '<br>sur surface ' + verdict(NGS.contrat.contraste(c, surface), seuil);
            var doux = /^cat-(\w+)$/.exec(n);
            if (doux) info += '<br>sur son fond doux ' + verdict(NGS.contrat.contraste(c, hex(css('--color-cat-' + doux[1] + '-soft', zone))), 4.5);
          }
          return '<div class="ds-nuance"><div class="ds-nuance__couleur" style="background:' + c + '"></div><div class="ds-nuance__info"><strong>--color-' + n + '</strong><span class="ds-token">' + c + '</span><span>' + info + '</span></div></div>';
        }).join('');
      });
    }
    couleurs();
    document.addEventListener('ngs-theme', couleurs);

    /* Espaces */
    document.querySelector('[data-espaces]').innerHTML = [1, 2, 3, 4, 6, 8, 10, 12, 16, 24, 40].map(function (n) {
      return '<div class="flex items-center gap-4"><span class="ds-token w-24">' + n * 4 + ' px</span><span style="height:12px;border-radius:3px;background:var(--color-text);width:' + n * 4 + 'px"></span></div>';
    }).join('');

    /* Icônes */
    fetch('assets/icons/sprite.svg').then(function (r) { return r.text(); }).then(function (t) {
      var ids = (t.match(/id="([^"]+)"/g) || []).map(function (m) { return m.slice(4, -1); }).filter(function (id) { return id !== 'ngshelf-logo'; }); /* le logo a sa section */
      document.querySelector('[data-icones]').innerHTML = ids.map(function (id) {
        return '<div class="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--color-border)]">' + NGS.icone(id, 'ngs-icon--lg') + '<span class="ds-token">' + id + '</span></div>';
      }).join('');
    });

    /* Marque : contrastes mesurés des paires du logo et du splash (valeurs lues dans tokens.css) */
    var etagere = css('--logo-etagere'); /* identique clair et sombre */
    var zs = document.querySelector('.ds-zone[data-theme="sombre"]');
    var clairSombre = css('--logo-tuile', zs), canvasSombre = hex(css('--color-canvas', zs)), surfSombre = hex(css('--color-surface', zs));
    var bleuNuit = '#191f42'; /* valeur clair de --logo-tuile (le thème actif peut être sombre) */
    var pairesM = [
      ['Tuile bleu nuit / fond blanc (logo clair, splash clair)', bleuNuit, '#ffffff', 3],
      ['Planche orange / fond blanc (valeur indicative : le logo est exempté, la planche ne porte aucun texte)', hex(etagere), '#ffffff', 0],
      ['Tuile claire / fond sombre du site', hex(clairSombre), canvasSombre, 3],
      ['Tuile claire / surface sombre', hex(clairSombre), surfSombre, 3],
      ['Planche orange / fond sombre du site', hex(etagere), canvasSombre, 3],
      ['Splash sombre : tuile claire / bleu nuit', hex(clairSombre), bleuNuit, 3],
      ['Splash sombre : planche orange / bleu nuit', hex(etagere), bleuNuit, 3]
    ];
    document.querySelector('[data-contrastes-marque]').innerHTML = pairesM.map(function (p) {
      return '<div class="ds-nuance"><div class="ds-nuance__info"><span>' + p[0] + '</span><span>' + verdict(NGS.contrat.contraste(p[1], p[2]), p[3]) + '</span></div></div>';
    }).join('');

    /* Cases */
    var cases = document.querySelector('[data-cases]');
    cases.innerHTML = NGS.caseHTML(NGS.trouver('interrupteur'), { taille: false }) +
      NGS.caseHTML(NGS.trouver('curseur'), { taille: false }).replace('class="ngs-case ', 'class="ngs-case is-hover ') +
      NGS.caseHTML(NGS.trouver('carte-sejour'), { taille: false });
    cases.querySelectorAll('.ngs-case').forEach(function (c) {
      var sd = c.querySelector('[data-design]');
      NGS.habiller(sd || c, sd ? sd.dataset.design : 'planche');
      c.querySelectorAll('a').forEach(function (a) { a.href = '../maquette/' + a.getAttribute('href'); });
    });
    cases.insertAdjacentHTML('afterend', '<p class="ngs-small ngs-muted mt-3 mb-0">Le haut de la case est la scène (composant réel, manipulable) ; le pied ouvre la fiche. Au milieu : état survol (−2 px, bordure plus foncée, ombre douce). À droite : une case « design », scène habillée par le thème.</p>');

    /* Code */
    var res = NGS.trouver('interrupteur');
    document.querySelector('[data-ds-code="ts"]').innerHTML = NGS.surligner(NGS.codeAngular(res, 'tailwind').ts, 'ts');
    document.querySelector('[data-ds-code="css"]').innerHTML = NGS.surligner(NGS.contrat.fichierTailwind(NGS.site.nom), 'css');
    NGS.onglets(document.querySelector('[data-ds-onglets]'));
    var cp = document.querySelector('[data-ds-copier]');
    cp.addEventListener('click', function () { NGS.copier(NGS.codeAngular(res, 'tailwind').ts, cp, 'interrupteur.component.ts copié.'); });
    document.querySelector('[data-demo-done]').addEventListener('click', function (e) { e.currentTarget.classList.toggle('is-done'); });

    /* Groupes radio de démonstration */
    document.querySelectorAll('[data-ds-radio]').forEach(function (g) { NGS.radio(g, function () {}); });

    /* Toasts, dialogue */
    document.querySelector('[data-toast-ok]').addEventListener('click', function () { NGS.toast('Code copié dans le presse-papiers.'); });
    document.querySelector('[data-toast-ko]').addEventListener('click', function () { NGS.toast('La copie a échoué. Sélectionnez le code puis copiez-le avec Ctrl + C (⌘ + C sur Mac).', 'error'); });
    var dlg = document.querySelector('[data-dialogue-el]');
    document.querySelector('[data-dialogue]').addEventListener('click', function () { dlg.showModal(); });
    dlg.querySelector('[data-fermer]').addEventListener('click', function () { dlg.close(); });
    document.querySelector('[data-recherche-ds]').addEventListener('click', function () { dlg.showModal(); });

    /* Contrat : valeurs par thème */
    var T = NGS.contrat.themes;
    var noms = { planche: 'Planche', fleuve: 'Fleuve', laterite: 'Latérite' };
    var entetes = '<thead><tr><th scope="col">Token</th>' + Object.keys(T).map(function (t) {
      return '<th scope="col">' + noms[t] + ' clair</th><th scope="col">' + noms[t] + ' sombre</th>';
    }).join('') + '</tr></thead>';
    function cellule(v) {
      return /^#/.test(v) ? '<span class="ds-pastille" style="background:' + v + '"></span><span class="ds-token">' + v + '</span>' : '<span class="ds-token">' + v.split(',')[0] + '</span>';
    }
    document.querySelector('[data-contrat]').innerHTML = entetes + '<tbody>' + NGS.contrat.ordre.map(function (k) {
      return '<tr><th scope="row" class="ds-token">' + k + '</th>' + Object.keys(T).map(function (t) {
        return '<td>' + cellule(T[t].clair[k]) + '</td><td>' + cellule(T[t].sombre[k]) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    var paires = [
      ['Texte sur action', '--ngs-color-on-action', '--ngs-color-action', 4.5],
      ['Texte / surface', '--ngs-color-text', '--ngs-color-surface', 4.5],
      ['Texte / surface secondaire', '--ngs-color-text', '--ngs-color-surface-alt', 4.5],
      ['Texte secondaire / surface', '--ngs-color-text-muted', '--ngs-color-surface', 4.5],
      ['Texte secondaire / surface secondaire', '--ngs-color-text-muted', '--ngs-color-surface-alt', 4.5],
      ['Bordure de contrôle / surface', '--ngs-color-border', '--ngs-color-surface', 3],
      ['Action (focus, piste) / surface', '--ngs-color-action', '--ngs-color-surface', 3],
      ['Erreur / surface', '--ngs-color-danger', '--ngs-color-surface', 4.5]
    ];
    document.querySelector('[data-contrat-contrastes]').innerHTML = entetes.replace('Token', 'Paire (seuil)') + '<tbody>' + paires.map(function (p) {
      return '<tr><th scope="row">' + p[0] + ' (' + p[3] + ':1)</th>' + Object.keys(T).map(function (t) {
        return ['clair', 'sombre'].map(function (m) { return '<td>' + verdict(NGS.contrat.contraste(T[t][m][p[1]], T[t][m][p[2]]), p[3]) + '</td>'; }).join('');
      }).join('') + '</tr>';
    }).join('') + '</tbody>';

    /* Annexe : token → utilitaires Tailwind */
    var corr = [
      ['--ngs-color-action', 'bg-ngs-action, text-ngs-action, border-ngs-action, outline-ngs-action, accent-ngs-action, ring-ngs-action/20'],
      ['--ngs-color-on-action', 'text-ngs-on-action, bg-ngs-on-action'],
      ['--ngs-color-surface', 'bg-ngs-surface'], ['--ngs-color-surface-alt', 'bg-ngs-surface-alt'],
      ['--ngs-color-text', 'text-ngs-text'], ['--ngs-color-text-muted', 'text-ngs-text-muted, placeholder:text-ngs-text-muted'],
      ['--ngs-color-border', 'border-ngs-border, shadow-[inset_0_0_0_1px_var(--color-ngs-border)]'], ['--ngs-color-danger', 'text-ngs-danger, border-ngs-danger'],
      ['--ngs-radius', 'rounded-ngs, rounded-[calc(var(--radius-ngs)*1.6)]'],
      ['--ngs-density', 'p-ngs-1 … p-ngs-16, gap-ngs-*, h-ngs-*, w-ngs-* (liste fermée : 1 à 16 × 4 px × densité)'],
      ['--ngs-font-family', 'font-ngs'], ['--ngs-duration', 'duration-(--ngs-duration)']
    ];
    document.querySelector('[data-correspondance]').innerHTML = '<thead><tr><th scope="col">Token</th><th scope="col">Utilitaires</th></tr></thead><tbody>' +
      corr.map(function (c) { return '<tr><th scope="row" class="ds-token">' + c[0] + '</th><td class="ds-token">' + c[1] + '</td></tr>'; }).join('') + '</tbody>';

    /* Motion */
    var M = [
      ['--duration-press', '--ease-out', 'Appui sur un bouton'],
      ['--duration-out', '--ease-out', 'Sortie de survol'],
      ['--duration-in', '--ease-out', 'Entrée de survol'],
      ['--duration-panel-in', '--ease-enter', 'Menu, dialogue, segment'],
      ['--duration-theme', '--ease-out', 'Changement de design sur la planche'],
      ['--duration-image-in', '--ease-enter', 'Révélation (clip-path) d’une vue'],
      ['--duration-image-in', '--ease-in-out', 'Déplacement (Flip du catalogue)']
    ];
    /* Ressource animée : la même case, animations activées puis coupées (classe .ngs-sans-animation sur l'hôte). */
    var anim = document.querySelector('[data-ds-anime]');
    if (anim) {
      anim.innerHTML = NGS.caseHTML(NGS.trouver('questions-frequentes'), { taille: false });
      NGS.habiller(anim.querySelector('.ngs-case'), 'planche');
      var sw = document.querySelector('[data-ds-anime-switch]');
      sw.addEventListener('change', function () {
        anim.querySelectorAll('ngs-apercu').forEach(function (h) { h.classList.toggle('ngs-sans-animation', !sw.checked); });
      });
    }
    var zone = document.querySelector('[data-motion]');
    zone.innerHTML = M.map(function (m) {
      return '<div class="grid gap-2 md:grid-cols-[18rem_1fr] items-center"><div><strong class="ngs-small">' + m[2] + '</strong><div class="ds-token">' + m[0] + ' (' + css(m[0]) + ') · ' + m[1] + '</div></div>' +
        '<div class="ds-piste"><span class="ds-bille" data-d="' + m[0] + '" data-e="' + m[1] + '"></span></div></div>';
    }).join('');
    function jouer() {
      zone.querySelectorAll('.ds-bille').forEach(function (b) {
        var reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
        b.style.transition = 'none'; b.style.transform = 'translateX(0)';
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          var dist = b.parentElement.clientWidth - b.offsetWidth - 16;
          b.style.transition = reduit ? 'none' : 'transform ' + css(b.dataset.d) + ' ' + css(b.dataset.e);
          b.style.transform = 'translateX(' + dist + 'px)';
        }); });
      });
    }
    document.querySelector('[data-rejouer]').addEventListener('click', jouer);
    setTimeout(jouer, 400);
    addEventListener('resize', function () { setTimeout(jouer, 100); });
  });
})();
