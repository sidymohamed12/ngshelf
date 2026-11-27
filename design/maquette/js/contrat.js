/*
  Contrat de tokens : lecture de design-system/contrat-tokens.css (seule source des valeurs),
  calcul des contrastes WCAG, génération du fichier tokens.css livré avec le code copié.
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});

  var ORDRE = [
    '--ngs-color-action', '--ngs-color-on-action', '--ngs-color-surface', '--ngs-color-surface-alt',
    '--ngs-color-text', '--ngs-color-text-muted', '--ngs-color-border', '--ngs-color-danger',
    '--ngs-radius', '--ngs-density', '--ngs-font-family', '--ngs-duration'
  ];

  function parser(css) {
    var themes = {};
    var re = /\.ngs-theme-([a-z]+)(\.ngs-sombre)?\s*\{([^}]*)\}/g;
    var m;
    while ((m = re.exec(css))) {
      var id = m[1];
      var mode = m[2] ? 'sombre' : 'clair';
      themes[id] = themes[id] || { clair: {}, sombre: {} };
      m[3].replace(/(--ngs-[a-z-]+)\s*:\s*([^;]+);/g, function (_, k, v) { themes[id][mode][k] = v.trim(); });
    }
    Object.keys(themes).forEach(function (id) {
      var t = themes[id];
      t.sombre = Object.assign({}, t.clair, t.sombre);
    });
    return themes;
  }

  NGS.contrat = {
    ordre: ORDRE,
    themes: null,
    pret: null,
    charger: function (url) {
      if (this.pret) return this.pret;
      var self = this;
      this.pret = fetch(url).then(function (r) { return r.text(); }).then(function (css) {
        self.themes = parser(css);
        return self.themes;
      });
      return this.pret;
    },
    /** Valeurs résolues : design + mode + surcharges de l'utilisateur. */
    valeurs: function (design, mode, surcharges) {
      var t = this.themes[design] || this.themes.planche;
      var v = Object.assign({}, t[mode || 'clair']);
      surcharges = surcharges || {};
      Object.keys(surcharges).forEach(function (k) { if (surcharges[k] != null) v[k] = surcharges[k]; });
      if (surcharges['--ngs-color-action']) v['--ngs-color-on-action'] = NGS.contrat.texteSur(surcharges['--ngs-color-action']);
      return v;
    },
    appliquer: function (el, valeurs) {
      ORDRE.forEach(function (k) { if (valeurs[k] != null) el.style.setProperty(k, valeurs[k]); });
    },
    luminance: function (hex) {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      var c = [0, 2, 4].map(function (i) {
        var x = parseInt(h.substr(i, 2), 16) / 255;
        return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    },
    contraste: function (a, b) {
      var la = this.luminance(a), lb = this.luminance(b);
      var hi = Math.max(la, lb), lo = Math.min(la, lb);
      return (hi + 0.05) / (lo + 0.05);
    },
    /** Blanc ou encre selon le meilleur contraste sur la couleur d'action. */
    texteSur: function (hex) {
      return this.contraste(hex, '#ffffff') >= this.contraste(hex, '#0b0b0c') ? '#ffffff' : '#0b0b0c';
    },
    /** Contenu du fichier tokens.css livré avec la ressource. */
    fichier: function (titre, design, surcharges, nomSite) {
      var clair = this.valeurs(design, 'clair', surcharges);
      var sombre = this.valeurs(design, 'sombre', surcharges);
      var nomDesign = (NGS.trouver(design) || {}).nomDesign || design;
      var personnalise = surcharges && Object.keys(surcharges).some(function (k) { return surcharges[k] != null; });
      var lignes = [
        '/*',
        '  ' + nomSite + ' — tokens pour « ' + titre + ' »',
        '  Design : ' + nomDesign + (personnalise ? ' (réglé par vous)' : ''),
        '  Importez ce fichier une fois dans styles.css. Sans lui, le composant garde ses valeurs de repli.',
        '  Mode sombre : ajoutez la classe .dark sur <html>.',
        '*/',
        ':root {'
      ];
      ORDRE.forEach(function (k) { lignes.push('  ' + k + ': ' + clair[k] + ';'); });
      lignes.push('}', '', '.dark {');
      ORDRE.slice(0, 8).forEach(function (k) { lignes.push('  ' + k + ': ' + sombre[k] + ';'); });
      lignes.push('}');
      return lignes.join('\n');
    }
    ,
    /** Variante Tailwind v4 : fichier pont « ngshelf-theme.css » (identique pour toutes les ressources, ADR 0002). */
    fichierTailwind: function (nomSite) {
      return [
        '/*',
        '  ' + nomSite + ' — pont Tailwind v4 (identique pour toutes les ressources)',
        '  À importer une fois dans styles.css, juste après @import "tailwindcss"; puis importer tokens.css.',
        '  @theme inline : les utilitaires (bg-ngs-action, rounded-ngs, p-ngs-4…) lisent les variables --ngs-*,',
        '  donc un changement de design ou de mode sombre est suivi sans recompiler.',
        '*/',
        this.themeTailwind()
      ].join('\n');
    },
    /** Bloc @theme inline : les utilitaires bg-ngs-action, rounded-ngs, p-ngs-4… lisent les variables --ngs-*. */
    themeTailwind: function () {
      var l = ['@theme inline {'];
      [['action', 'action'], ['on-action', 'on-action'], ['surface', 'surface'], ['surface-alt', 'surface-alt'],
        ['text', 'text'], ['text-muted', 'text-muted'], ['border', 'border'], ['danger', 'danger']].forEach(function (c) {
        l.push('  --color-ngs-' + c[0] + ': var(--ngs-color-' + c[1] + ');');
      });
      l.push('  --radius-ngs: var(--ngs-radius);', '  --font-ngs: var(--ngs-font-family);');
      for (var i = 1; i <= 16; i++) l.push('  --spacing-ngs-' + i + ': calc(var(--ngs-density) * ' + i * 4 + 'px);');
      l.push('}');
      return l.join('\n');
    }
  };
})();
