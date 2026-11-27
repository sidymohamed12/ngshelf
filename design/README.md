# design/ — NgShelf

Tout ce dossier est du design : rien n'est intégré dans l'application. La référence est `../DESIGN.md`.

## Ouvrir

Les pages lisent `tokens.css` et `contrat-tokens.css` avec `fetch` (chemins relatifs) : il faut les servir en HTTP (page hébergée ou serveur local), `file://` ne suffit pas.

```bash
python3 -m http.server 4173 --directory design   # à lancer depuis la racine du dépôt (ngshelf-frontend)
```

Une connexion internet est nécessaire : Tailwind (navigateur) 4.3.5, GSAP 3.15.1 et Lenis 1.3.28 viennent de `cdn.jsdelivr.net/npm/`, en version exacte.

| Quoi | Adresse |
| --- | --- |
| Maquette, accueil | http://localhost:4173/maquette/index.html |
| Maquette, catalogue | http://localhost:4173/maquette/catalogue.html |
| États du catalogue | `catalogue.html?etat=chargement`, `?etat=erreur`, `?c=templates` (vide), `?secteur=restaurant`, `?type=carte` |
| Maquette, fiche (réglages, copie, zip) | http://localhost:4173/maquette/ressource.html?r=calendrier |
| Maquette, à propos (v0.4 : page vitrine, moment épinglé) | http://localhost:4173/maquette/a-propos.html |
| Catalogue, ressources animées | `catalogue.html?animees=1` |
| Mode sombre | menu du thème dans le header (cookie `ngs_theme`) |
| Comparaison des polices (v0.3) | http://localhost:4173/demos-concepts/polices.html |
| Fiche introuvable | `ressource.html?r=inconnue` |
| Design system | http://localhost:4173/design-system/index.html |
| Comparaison des concepts | http://localhost:4173/demos-concepts/a-vue-eclatee.html, `b-planche-specimen.html`, `c-signal.html` |

## Contenu

| Dossier ou fichier | Contenu |
| --- | --- |
| `brief.md`, `concepts.md` | Étape 1 |
| `design-system/` | `tokens.css` (`@theme` du site, seule source des valeurs), `contrat-tokens.css` (12 tokens des ressources et 3 designs), `components.css`, `index.html`, polices, sprite Phosphor |
| `maquette/` | 4 pages jouables (accueil, catalogue, fiche, à propos) |
| `maquette/js/` | `config.js` (nom du site et liens de Sidy, à un seul endroit), `textes.fr.js` (tous les textes), `registre.js` (10 ressources et 3 designs provisoires, taxonomie de l'ADR 0004, champ `motion`), `variantes.js` (versions Tailwind et CSS) |
| `demos-concepts/` | Un hero par concept, pour comparer ; `polices.html` : trois paires de polices, paire C appliquée (v0.4) |
