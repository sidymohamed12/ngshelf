/*
  <ngs-apercu ressource="slug"> : rend une ressource du registre dans une racine Shadow DOM
  (ADR 0003 : rendu en page pour l'accueil et le catalogue, iframe pour le détail).
  Les tokens --ngs-* posés sur l'élément hôte traversent la frontière Shadow DOM (héritage CSS).
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});
  if (customElements.get('ngs-apercu')) return;

  class NgsApercu extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      var res = NGS.trouver && NGS.trouver(this.getAttribute('ressource'));
      var root = this.attachShadow({ mode: 'open' });
      if (!res || !res.css) {
        root.innerHTML = '<p style="font:14px system-ui;color:#5f5f66">Aperçu indisponible.</p>';
        return;
      }
      var variante = this.getAttribute('demo');
      root.innerHTML = '<style>' + res.css + '</style>' + (variante && res.demos ? res.demos[variante] : res.demo);
      if (res.init && !variante) {
        try { res.init(root, function (n) { return n; }); } catch (e) { console.error('[apercu]', res.slug, e); }
      }
    }
  }

  customElements.define('ngs-apercu', NgsApercu);
})();
