/* Page 404 : affiche l'adresse demandée (texte seulement, jamais du HTML). Sur l'hébergeur, 404.html est servi à l'adresse introuvable. */
(function () {
  var bloc = document.querySelector('[data-adresse]');
  if (!bloc) return;
  var adresse = (location.pathname + location.search).slice(0, 200);
  bloc.querySelector('[data-adresse-valeur]').textContent = adresse;
  bloc.hidden = false;
})();
/* Les pièces de l'étagère prennent le design « planche » et suivent le thème du site (clair / sombre). */
(function () {
  var NGS = window.NGS;
  NGS.pret.then(function () {
    document.querySelectorAll('.nf-piece').forEach(function (el) { NGS.habiller(el, 'planche'); });
  });
})();
