/*
  Variantes de code d'une ressource : « css » (CSS du composant + tokens) ou « tailwind » (utilitaires Tailwind v4).
  Une seule source de balisage : les classes BEM du registre sont remplacées par les utilitaires de res.tw.
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});

  /** Remplace chaque classe BEM connue par ses utilitaires ; garder = conserve la classe BEM (démo). */
  NGS.mapperClasses = function (html, tw, garder) {
    function liste(valeur) {
      var sortie = [];
      valeur.split(/\s+/).filter(Boolean).forEach(function (c) {
        if (tw[c]) { if (garder) sortie.push(c); sortie.push(tw[c]); }
        else sortie.push(c);
      });
      return sortie.join(' ');
    }
    // class="…", et les classes posées par Angular à l'entrée / la sortie : animate.enter="…", animate.leave="…".
    html = html.replace(/(\s)(class|animate\.enter|animate\.leave)="([^"]*)"/g, function (tout, esp, attr, valeur) {
      return esp + attr + '="' + liste(valeur) + '"';
    });
    // [animate.enter]="expression" : chaque chaîne 'classe-bem' connue devient ses utilitaires.
    return html.replace(/\[animate\.(enter|leave)\]="([^"]*)"/g, function (tout, quand, expr) {
      return '[animate.' + quand + ']="' + expr.replace(/'([\w-]+)'/g, function (m, c) { return tw[c] ? "'" + liste(c) + "'" : m; }) + '"';
    });
  };

  /** Fonction de classes passée à init() : identité en CSS, BEM + utilitaires en Tailwind. */
  NGS.cls = function (res, variante) {
    if (variante !== 'tailwind' || !res.tw) return function (n) { return n; };
    return function (n) { return res.tw[n] ? n + ' ' + res.tw[n] : n; };
  };

  /** Démo Tailwind : balisage mappé, enveloppé dans l'équivalent de l'hôte Angular. */
  NGS.demoTailwind = function (res) {
    return '<div class="' + (res.tw[':host'] || '') + '">' + NGS.mapperClasses(res.demo, res.tw, true) + '</div>';
  };

  /** Code Angular d'une variante : { ts, html, css|null } */
  NGS.codeAngular = function (res, variante) {
    var a = res.angular;
    var tw = variante === 'tailwind';
    // Hôte : classes Tailwind de l'hôte, et interrupteur des animations propres (input animations → .ngs-sans-animation).
    var hote = [];
    if (tw && res.tw[':host']) hote.push("class: '" + res.tw[':host'] + "'");
    if (res.motion) hote.push("'[class.ngs-sans-animation]': '!animations()'");
    var host = hote.length ? 'host: { ' + hote.join(', ') + ' },' : '';
    var style = tw
      ? host + (res.keyframesTailwind ? (host ? '\n  ' : '') + "styleUrl: './" + a.nom + ".component.css', // @keyframes seulement" : '')
      : "styleUrl: './" + a.nom + ".component.css'," + (host ? '\n  ' + host : '');
    var ts = a.ts.replace(/\n(\s*)\/\*STYLE\*\/\n/, style ? '\n$1' + style + '\n' : '\n');
    return {
      ts: ts,
      html: tw ? NGS.mapperClasses(a.html, res.tw, false) : a.html,
      css: tw ? null : res.css
    };
  };
})();
