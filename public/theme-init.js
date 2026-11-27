/*
  Thème du site : appliqué AVANT le premier rendu, pour qu'aucun éclair de mauvais thème n'apparaisse.
  Fichier externe (la CSP interdit les scripts en ligne : script-src 'self').
  Lit le cookie fonctionnel ngs_theme (clair, sombre ou systeme) et pose data-theme sur <html>.
  Le même choix est ensuite repris par ThemeService (src/app/core/theme/theme.service.ts) :
  les valeurs du cookie et des attributs doivent rester identiques dans les deux.
*/
(function () {
  var racine = document.documentElement;
  var memorise = document.cookie.match(/(?:^|; )ngs_theme=(clair|sombre|systeme)/);
  var choix = memorise ? memorise[1] : 'systeme';
  var sombre =
    choix === 'sombre' ||
    (choix === 'systeme' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  racine.setAttribute('data-theme-choix', choix);
  if (sombre) {
    racine.setAttribute('data-theme', 'sombre');
  }
})();
