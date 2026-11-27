# Crédits — images, polices, icônes, bibliothèques

## Images

Photos téléchargées depuis Unsplash le 26 novembre 2026, puis converties en WebP (640, 1024 et 1600 px, qualité 72). Elles ne sont jamais chargées depuis Unsplash.

Licence : [Unsplash License](https://unsplash.com/license), lue le 26 novembre 2026.
- usage commercial autorisé ;
- attribution non obligatoire (faite ici quand même) ;
- interdit de revendre l'image telle quelle, ou de compiler des images Unsplash pour en faire un service concurrent.

**Provisoire** : à remplacer par des photos réelles du client si le catalogue en reçoit.

| Fichiers | Sujet | Auteur | Source | Où |
| --- | --- | --- | --- | --- |
| `yassa-640.webp`, `yassa-1024.webp`, `yassa-1600.webp` | Poulet yassa, riz, alloco, piments (cuisine sénégalaise) | Keesha's Kitchen | https://unsplash.com/photos/a-table-full-of-food-eaSIzdS8pv0 | Ressource « Hero avec photo » (secteur Restaurant), vitrine du hero de l'accueil |
| `stlouis-640.webp`, `stlouis-1024.webp`, `stlouis-1600.webp` | Pirogues colorées sur le fleuve, Saint-Louis du Sénégal | Baptiste Riethmann | https://unsplash.com/photos/many-colorful-fishing-boats-docked-in-a-busy-harbor-3e6S9cCD79s | Ressource « Carte de séjour » (secteur Voyage) |

Poids :

| Fichier | Poids |
| --- | --- |
| `yassa-640.webp` | 54 Ko |
| `yassa-1024.webp` | 121 Ko |
| `yassa-1600.webp` | 255 Ko |
| `stlouis-640.webp` | 27 Ko |
| `stlouis-1024.webp` | 59 Ko |
| `stlouis-1600.webp` | 121 Ko |

Côté LCP :
- la photo de la vitrine est en `fetchpriority="high"` et ne se charge pas en différé ;
- `sizes="(min-width: 1024px) 40vw, 90vw"` : le navigateur prend la version 640 ou 1024 dans la plupart des cas.

## Photo de l'auteur (v0.4)

| Fichiers | Sujet | Source | Où |
| --- | --- | --- | --- |
| `sidy-360.webp`, `sidy-540.webp` (recadrage 4:5, qualité 80 ; 10 et 16 Ko) | Sidy Mohamed Saizonou | Photo fournie par Sidy (fichier `sidy-source.jpeg`, 675 × 675, supprimé après conversion) | Page « À propos », section « Qui le développe » |

## Photo d'illustration (v0.5)

Licence : [Unsplash License](https://unsplash.com/license) (gratuite, usage commercial autorisé, attribution non obligatoire mais faite ici ; photo hors Unsplash+), lue le 26 novembre 2026.

| Fichiers | Sujet | Auteur | Source | Où |
| --- | --- | --- | --- | --- |
| `lagos-code-640.webp` (26 Ko), `lagos-code-1024.webp` (46 Ko) | Ordinateur portable ouvert sur un éditeur de code (VS Code) et un terminal, Lagos (Nigeria) | @disruptxn | https://unsplash.com/photos/laptop-compute-displaying-command-prompt-vII7qKAk-9A | Page « À propos », section « Comment c’est fait » |

Fichier fourni par Sidy (`lagos-code-source.webp`, 2000 × 1333), redimensionné en WebP (qualité 74), puis supprimé.

Écartée : « young African American IT developer… » (Getty Images) : licence Unsplash+, payante.

## Polices (auto-hébergées dans `../fonts/` et `design/design-system/assets/fonts/`)

Depuis la v0.4 (choix de Sidy, paire C) :

| Police | Fichiers | Licence | Source |
| --- | --- | --- | --- |
| Chivo (Omnibus-Type ; variable wght 400–800, réduite au latin) | `chivo-latin-var.woff2` (27 Ko) | SIL OFL 1.1 (`OFL-chivo.txt`) | https://github.com/google/fonts/tree/main/ofl/chivo ; listée sur https://www.1001fonts.com/chivo-font.html (« Free for commercial use ») |
| Chivo Mono (Omnibus-Type ; variable wght 400–600, réduite au latin) | `chivo-mono-latin-var.woff2` (19 Ko) | SIL OFL 1.1 (même fichier de licence que Chivo : `OFL-chivo.txt`, copyright « The Chivo Project Authors ») | https://github.com/google/fonts/tree/main/ofl/chivomono |

Archivo et IBM Plex Mono (v0.3) sont retirées de la maquette et du design system ; elles restent seulement pour la page de comparaison `design/demos-concepts/polices.html` (fichiers et licences dans `design/demos-concepts/assets/fonts/`).

Bricolage Grotesque n'est plus utilisée par la maquette (depuis la v0.3). Elle reste seulement pour l'ancienne démonstration `design/demos-concepts/b-planche-specimen.html` (fichier dans `design/demos-concepts/assets/fonts/`). Les polices des paires comparées (Encode Sans, Chivo, Chivo Mono, toutes SIL OFL 1.1) sont dans `design/demos-concepts/assets/fonts/` avec leur fichier de licence.

Icônes ajoutées en v0.3 (Phosphor regular, MIT) : `wave-sine` (badge « Animée »).
