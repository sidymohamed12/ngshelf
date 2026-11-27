/*
  Zip minimal (méthode « stored », sans compression) généré dans le navigateur, sans dépendance.
  Maquette seulement : en production, le zip standard est produit au build (ADR 0002) ;
  le zip « avec vos réglages » reste généré côté navigateur.
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});
  var TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function dosDate(d) {
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time: time, date: date };
  }

  /** fichiers : [{ nom: 'dossier/fichier.ts', contenu: '...' }] → Blob application/zip */
  NGS.zip = function (fichiers) {
    var enc = new TextEncoder();
    var locaux = [], centraux = [], offset = 0;
    var dd = dosDate(new Date());
    fichiers.forEach(function (f) {
      var nom = enc.encode(f.nom);
      var data = enc.encode(f.contenu);
      var crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, dd.time, true); h.setUint16(12, dd.date, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, nom.length, true); h.setUint16(28, 0, true);
      locaux.push(new Uint8Array(h.buffer), nom, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, dd.time, true); c.setUint16(14, dd.date, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, nom.length, true); c.setUint32(42, offset, true);
      centraux.push(new Uint8Array(c.buffer), nom);
      offset += 30 + nom.length + data.length;
    });
    var tailleCentral = centraux.reduce(function (s, b) { return s + b.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, fichiers.length, true); e.setUint16(10, fichiers.length, true);
    e.setUint32(12, tailleCentral, true); e.setUint32(16, offset, true);
    return new Blob(locaux.concat(centraux, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  };

  NGS.telechargerBlob = function (blob, nom) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };
})();
