/*
  Ce que l'utilisateur emporte : fichiers d'une ressource (+ tokens.css), « tout copier », zip.
  Tout part du registre : aucune sortie écrite à la main (ADR 0002).
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});

  var MIT = [
    'MIT License',
    '',
    'Copyright (c) {annee} {titulaire}',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction, including without limitation the rights',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    'copies of the Software, and to permit persons to whom the Software is',
    'furnished to do so, subject to the following conditions:',
    '',
    'The above copyright notice and this permission notice shall be included in all',
    'copies or substantial portions of the Software.',
    '',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
    'SOFTWARE.'
  ].join('\n');

  /** Fichiers de la ressource pour une variante (« tailwind » par défaut ou « css »), tokens.css compris. */
  NGS.fichiersRessource = function (res, design, surcharges, variante) {
    variante = variante || 'tailwind';
    var liste = [];
    if (res.angular) {
      (res.angular.extras || []).forEach(function (f) { liste.push({ nom: f.nom, langage: f.langage, code: f.code }); });
      var c = NGS.codeAngular(res, variante);
      var nom = res.angular.nom + '.component';
      liste.push({ nom: nom + '.ts', langage: 'ts', code: c.ts }, { nom: nom + '.html', langage: 'html', code: c.html });
      if (c.css) liste.push({ nom: nom + '.css', langage: 'css', code: c.css });
    }
    if (res.angular && variante === 'tailwind' && res.keyframesTailwind) {
      liste.push({ nom: res.angular.nom + '.component.css', langage: 'css', code: res.keyframesTailwind });
    }
    var d = design || res.design || 'planche';
    liste.push({ nom: 'tokens.css', langage: 'css', code: NGS.contrat.fichier(res.titre, d, surcharges, NGS.site.nom) });
    if (variante === 'tailwind') {
      var nomTheme = NGS.site.nom.toLowerCase() + '-theme.css';
      liste.push({ nom: nomTheme, langage: 'css', code: NGS.contrat.fichierTailwind(NGS.site.nom) });
    }
    return liste;
  };

  NGS.toutLeCode = function (res, design, surcharges, variante) {
    return NGS.fichiersRessource(res, design, surcharges, variante).map(function (f) {
      var c = f.langage === 'html' ? '<!-- ' + f.nom + ' -->' : '/* ' + f.nom + ' */';
      return c + '\n' + f.code;
    }).join('\n\n');
  };

  NGS.zipRessource = function (res, design, surcharges, variante) {
    variante = variante || 'tailwind';
    var fichiers = NGS.fichiersRessource(res, design, surcharges, variante);
    var dossier = res.slug + (variante === 'tailwind' ? '-tailwind' : '-css');
    var readme = NGS.t('zip.readme', {
      titre: res.titre,
      description: res.description,
      angular: res.angularVersion,
      slug: res.slug,
      variante: NGS.t('code.variante.' + variante),
      installation: NGS.t('zip.installation.' + variante, { slug: res.slug }),
      dependances: res.dependances.length ? res.dependances.join(', ') : NGS.t('ressource.meta.aucune'),
      usage: res.usage
    });
    var licence = MIT.replace('{annee}', String(new Date().getFullYear())).replace('{titulaire}', NGS.t('zip.licence.titulaire'));
    var entrees = fichiers.map(function (f) { return { nom: dossier + '/' + f.nom, contenu: f.code }; });
    entrees.push({ nom: dossier + '/README.md', contenu: readme }, { nom: dossier + '/LICENSE', contenu: licence });
    return { nom: dossier + '.zip', blob: NGS.zip(entrees), entrees: entrees };
  };

  NGS.taille = function (texte) {
    var o = new TextEncoder().encode(texte).length;
    return o < 1024 ? o + ' o' : (o / 1024).toFixed(1).replace('.', ',') + ' Ko';
  };
})();
