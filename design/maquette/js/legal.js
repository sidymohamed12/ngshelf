/*
  Pages légales (mode Lire) : le sommaire est déplié en permanence sur ordinateur (collant, via CSS),
  repliable sur mobile ; la section lue est marquée dans le sommaire (aria-current="location").
  Aucune animation d'entrée, pas de Lenis (HANDOFF, section 3).
*/
(function () {
  var NGS = window.NGS;
  var nav = document.querySelector('[data-sommaire]');
  if (!nav) return;
  var details = nav.querySelector('details');
  var mq = matchMedia('(min-width: 64rem)');
  var dejaVu = false;
  function adapter() {
    if (mq.matches) details.open = true;
    else if (!dejaVu) details.open = false; // mobile : replié au chargement, ensuite le visiteur décide
    dejaVu = true;
  }
  adapter();
  mq.addEventListener('change', function () { dejaVu = false; adapter(); });
  // Sur mobile, un clic sur une entrée referme le sommaire pour laisser voir la section.
  nav.addEventListener('click', function (e) { if (!mq.matches && e.target.closest('.ngs-sommaire__lien')) details.open = false; });

  var liens = Array.prototype.slice.call(nav.querySelectorAll('.ngs-sommaire__lien'));
  var sections = liens.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function marquer(id) {
    liens.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  function maj() {
    var repere = 140, courant = sections[0];
    sections.forEach(function (s) { if (s && s.getBoundingClientRect().top <= repere) courant = s; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) courant = sections[sections.length - 1];
    if (courant) marquer(courant.id);
  }
  addEventListener('scroll', maj, { passive: true });
  addEventListener('resize', maj);
  NGS.pret.then(maj);
})();
