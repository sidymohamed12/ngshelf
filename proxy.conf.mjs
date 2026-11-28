/**
 * Développement (`ng serve ngshelf`) : `/apercu/*` est servi par l'application d'aperçus, un second
 * serveur (`ng serve apercus`, port 4201), que `npm start` lance avec le site. Si ce serveur ne tourne
 * pas, le proxy répond une page explicative (503) à la place d'une erreur de connexion muette : elle
 * s'affiche dans l'iframe, et la case ou la fiche garde son repli.
 */
const PORT_APERCUS = 4201;

const MESSAGE =
  `Aperçus indisponibles : le serveur des aperçus (port ${PORT_APERCUS}) ne répond pas. ` +
  'Lancez « npm start » (site et aperçus ensemble) ou « npm run start:apercus » dans un second terminal.';

const PAGE = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Aperçus indisponibles</title>
<body style="font:14px/1.5 system-ui;margin:1rem;color:#444"><p>${MESSAGE}</p></body></html>`;

export default {
  '/apercu': {
    target: `http://localhost:${PORT_APERCUS}`,
    secure: false,
    configure(proxy) {
      proxy.on('error', (_erreur, _requete, reponse) => {
        if (typeof reponse.writeHead !== 'function' || reponse.headersSent) return;
        reponse.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        reponse.end(PAGE);
      });
    },
  },
};
