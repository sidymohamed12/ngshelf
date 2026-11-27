/*
  Chargeur de maquette (sans build).
  Le navigateur ne sait pas faire `@import` d'un fichier local avec @tailwindcss/browser :
  ce script lit tokens.css + components.css (seules sources), les place dans un
  <style type="text/tailwindcss">, puis charge Tailwind v4 (navigateur).

  Usage : <script src="../design-system/load.js" data-assets="./assets/"></script>
  data-assets : dossier où la page trouve fonts/ (par défaut, celui du design system).

  Nécessite un serveur local (fetch ne marche pas en file://) :
    python3 -m http.server 4173 --directory design   (depuis la racine du dépôt)
*/
(function () {
  var script = document.currentScript;
  var base = new URL('.', script.src);
  var assets = script.dataset.assets ? new URL(script.dataset.assets, document.baseURI) : new URL('assets/', base);
  document.documentElement.classList.add('ngs-js');

  if (location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', function () {
      var p = document.createElement('p');
      p.setAttribute('role', 'alert');
      p.style.cssText = 'position:fixed;inset:auto 1rem 1rem 1rem;z-index:9999;padding:1rem;background:#0b0b0c;color:#fff;font:16px/1.5 system-ui;border-radius:12px';
      p.textContent = 'Cette maquette doit être servie en HTTP (page hébergée, ou serveur local : python3 -m http.server 4173 --directory design, depuis la racine du dépôt).';
      document.body.appendChild(p);
    });
    return;
  }

  var files = ['tokens.css', 'components.css'];
  window.ngsStylesReady = Promise.all(files.map(function (f) {
    return fetch(new URL(f, base)).then(function (r) {
      if (!r.ok) throw new Error(f + ' : ' + r.status);
      return r.text();
    });
  })).then(function (parts) {
    var css = parts.join('\n').replace(/url\("\.\/assets\//g, 'url("' + assets.href);
    var style = document.createElement('style');
    style.type = 'text/tailwindcss';
    style.textContent = '@import "tailwindcss";\n' + css;
    document.head.prepend(style);
    return new Promise(function (resolve) {
      var tw = document.createElement('script');
      tw.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.5';
      tw.onload = function () {
        // Laisse Tailwind compiler, puis signale que les styles sont posés.
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          document.documentElement.classList.add('ngs-styled');
          document.fonts.ready.then(resolve);
        }); });
      };
      tw.onerror = function () { resolve(); };
      document.head.appendChild(tw);
    });
  }).catch(function (e) { console.error('[NgShelf] styles', e); });
})();
