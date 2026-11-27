# Brief — catalogue open source de composants Angular

Étape 1 de la méthode design (brief + concepts). Rien n'est encore validé. Les concepts sont dans `design/concepts.md`.

## 1. Ce que j'ai compris de la demande

> « un site open source sans connexion ni achat. Dans ce site, je propose des templates, composants, designs, et autres d'Angular. Des composants qu'on peut copier-coller le code ou télécharger. Ça doit vraiment être un site qui donne l'effet wow. »

- **Produit** : un catalogue public et gratuit de ressources Angular (composants, blocs / sections, templates de pages, designs), sans compte, sans paiement, sans back-office.
- **Usage** : trouver une ressource, la voir fonctionner en vrai, copier son code ou la télécharger, repartir dans son projet.
- **Action principale** (proposée) : « Copier le code ». Action secondaire : « Télécharger le composant ». Sur l'accueil : « Parcourir les composants ».
- **Exigence forte** : effet « wow » dès l'ouverture, motion riche (GSAP, Lenis, éventuellement Three.js dans le hero), sans look « généré par IA ».
- **Stack d’arrivée** : Angular 22 (arbitrage de l’architecte, ADR 0001) + Tailwind v4 (intégration par `frontend-dev`, conventions `angular-sidy`). Mon travail s'arrête au design (maquette HTML/CSS validée + `HANDOFF.md`).

## 2. Modes de surface (design-sidy §1)

| Surface | Mode | Niveau de motion |
| --- | --- | --- |
| Page d'accueil | **Convaincre** | Niveau 1 : riche (hero orchestré, 2–3 moments forts, Lenis possible) |
| Catalogue (liste + recherche + filtres) | **Expérience** | Niveau 2 : Flip sur filtres / tri, cascade courte, transitions de route carte → détail |
| Page de détail d'une ressource (aperçu live, code, téléchargement) | **Expérience** (avec des zones **Lire** pour l'installation et l'API) | Niveau 2 : onglets à indicateur glissant, retour « Copié », bascule de viewport de l'aperçu |
| Documentation / installation / licence / contribuer | **Lire** | Micro-interactions et ancres seulement |
| 404 | Convaincre (léger) | Une animation dans le concept |

## 3. Une contrainte structurante propre à ce produit

Le site **montre les designs des autres** (les composants du catalogue ont chacun leur propre style). L'identité du site doit donc être forte dans le cadre (accueil, navigation, typographie, motion) mais **neutre autour des aperçus**, sinon elle se bat avec ce qu'elle expose. Les trois concepts répondent à ce point différemment.

## 4. Pistes de nom (à trancher)

Aucune disponibilité de nom de domaine, de paquet npm ou de marque n'a été vérifiée : à contrôler avant de choisir.

Règle de nommage relevée dans les press kits Angular (anciennes versions) : un projet tiers doit s'appeler « X for Angular » ou « ng-X », et éviter « Angular X » (risque de confusion sur l'auteur). Le press kit actuel demande aussi de **distinguer son logo du bouclier Angular**. Donc : pas de bouclier redessiné, pas de nom en « Angular … ».

| Nom | Idée | Variante technique |
| --- | --- | --- |
| **NgShelf** | Une étagère (shelf) où l'on prend des composants Angular, avec le préfixe « ng ». Le nom dit ce que fait le site. | `ngshelf`, « NgShelf for Angular » |
| **Établi** | La table de travail où l'on pose les pièces avant de les assembler. Chaleureux, artisanal, français. | `ng-etabli` (sans accent dans les identifiants) |
| **Calque** | La feuille transparente qu'on pose sur un plan pour reprendre un tracé : copier, adapter. | `ng-calque` |
| **Copeau** | Ce qu'on récupère de l'atelier, petit, gratuit, prêt à prendre. Plus ludique. | `ng-copeau` |
| **Spécimen** | Comme une planche spécimen de typographe : on voit chaque pièce, on la prend. Colle au concept B. | `ng-specimen` |

Ma préférence : **NgShelf** (sens exact, court, prononçable en français comme en anglais).

## 5. Contenu supposé (à confirmer)

Je n'invente aucun contenu. Ce qui suit est **supposé** et sert seulement à dessiner les écrans :

- Catégories : composants, blocs (sections), templates (pages complètes), designs (thèmes / kits de tokens). « Et autres » reste à préciser.
- Page de détail : aperçu live interactif, bascule mobile / tablette / desktop, onglets de code (`.ts`, `.html`, `.css`), commande d'installation, bouton « Télécharger le composant » (zip), dépendances, version d'Angular, licence.
- Recherche plein texte + filtres (catégorie, type, dépendances, version d'Angular).
- Aucun chiffre (« 300 composants », étoiles GitHub, nombre de téléchargements) ne sera affiché tant que les vrais chiffres n'existent pas.

## 6. Ce qui manque au brief (design-sidy §0)

Les questions précises sont regroupées en fin de `design/concepts.md` (section « Questions à trancher »). Je ne passe pas au design system tant qu'elles ne sont pas tranchées et qu'un concept n'est pas choisi.

## 7. Ressources vérifiées à cette étape

Polices citées dans les concepts, licence lue sur le fichier de licence officiel (GitHub) :

| Police | Licence vérifiée | Source |
| --- | --- | --- |
| Schibsted Grotesk | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/schibstedgrotesk/OFL.txt |
| JetBrains Mono | SIL OFL 1.1 | https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt |
| Bricolage Grotesque | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/bricolagegrotesque/OFL.txt |
| IBM Plex Mono | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/ibmplexmono/OFL.txt |
| Instrument Sans | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/instrumentsans/OFL.txt |
| Martian Mono | SIL OFL 1.1 | https://github.com/google/fonts/blob/main/ofl/martianmono/OFL.txt |

Toutes gratuites pour usage commercial et web, auto-hébergeables. La couverture des accents français (é è à ç œ « ») sera contrôlée sur les fichiers au moment du design system.

Références de marque Angular consultées : https://angular.dev/press-kit, https://v10.angular.cn/presskit.

Les effets de motion décrits dans les concepts sont des intentions ; la recherche avec noms exacts et liens dans les références (reactbits, 21st.dev, animata, Magic UI, freefrontend, awwwards…) se fait à l'étape 4 (tableau de motion).
