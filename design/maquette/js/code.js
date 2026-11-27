/*
  Coloration syntaxique minimale pour la maquette (TS, HTML Angular, CSS).
  En production : Shiki au build (ADR 0002), mêmes classes de couleur (.tok-*).
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});

  function echapper(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function span(c, t) { return '<span class="tok-' + c + '">' + t + '</span>'; }

  var MOTS_TS = /\b(import|from|export|class|interface|const|let|readonly|protected|private|public|return|if|else|new|function|type|of|in|void|boolean|number|string|null|undefined|true|false|this)\b/g;

  function ts(code) {
    var out = '';
    var re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")|(@[A-Za-z]+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;
    var m;
    while ((m = re.exec(code))) {
      if (m[1]) out += span('c', echapper(m[1]));
      else if (m[2]) out += span('s', echapper(m[2]));
      else if (m[3]) out += span('a', echapper(m[3]));
      else if (m[4]) out += span('n', m[4]);
      else if (m[5]) out += MOTS_TS.test(m[5]) ? span('k', m[5]) : echapper(m[5]);
      else out += echapper(m[6]);
      MOTS_TS.lastIndex = 0;
    }
    return out;
  }

  function html(code) {
    var out = '';
    var re = /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)([^>]*?)(\/?>)|(@(?:for|if|else|switch|case|defer)\b)|(\{\{[\s\S]*?\}\})|([^<@{]+|[\s\S])/g;
    var m;
    while ((m = re.exec(code))) {
      if (m[1]) out += span('c', echapper(m[1]));
      else if (m[3]) {
        out += span('p', echapper(m[2])) + span('t', m[3]);
        out += m[4].replace(/([\[\(#]*[\w.\-@:$]+[\]\)]*)(=)?("[^"]*")?|([^"]+?)/g, function (all, nom, eg, val, autre) {
          if (autre) return echapper(autre);
          return (nom ? span('a', echapper(nom)) : '') + (eg ? span('p', '=') : '') + (val ? span('s', echapper(val)) : '');
        });
        out += span('p', echapper(m[5]));
      } else if (m[6]) out += span('k', m[6]);
      else if (m[7]) out += span('n', echapper(m[7]));
      else out += echapper(m[8]);
    }
    return out;
  }

  function css(code) {
    var out = '';
    var re = /(\/\*[\s\S]*?\*\/)|("[^"]*")|(--[\w-]+)|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b|\b\d*\.?\d+(?:px|ms|rem|em|%|deg|s)?\b)|([\w-]+)(?=\s*:)|([\s\S])/g;
    var m;
    while ((m = re.exec(code))) {
      if (m[1]) out += span('c', echapper(m[1]));
      else if (m[2]) out += span('s', echapper(m[2]));
      else if (m[3]) out += span('t', m[3]);
      else if (m[4]) out += span('k', m[4]);
      else if (m[5]) out += span('n', m[5]);
      else if (m[6]) out += span('a', m[6]);
      else out += echapper(m[7]);
    }
    return out;
  }

  NGS.surligner = function (code, langage) {
    if (langage === 'ts') return ts(code);
    if (langage === 'html') return html(code);
    if (langage === 'css') return css(code);
    return echapper(code);
  };
})();
