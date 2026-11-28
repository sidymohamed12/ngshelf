# 0017 — Aperçus manipulables dans les cases de la planche

## Statut

proposé (2026-11-28). Amende l'ADR 0015 : remplace sa décision 4 (« pas d'interaction, la case entière est le lien ») et complète les décisions 2 (plafond), 8 et 9 ; les décisions 1, 3, 5, 6 et 7 de l'ADR 0015, l'ADR 0003 et l'ADR 0010 (sandbox, protocole, en-têtes) restent en vigueur. Le HANDOFF (« la scène est interactive, le pied `.ngs-case__link` ouvre la fiche ») décrivait déjà ce découpage de la case.

## Contexte

Sidy a testé `npm start` et demande que les aperçus des cases soient manipulables : cliquer, glisser, taper, survoler. L'ADR 0015 les avait rendus décoratifs (`pointer-events: none`, case entière = lien) parce que les ressources à défilement épinglé (`media-extensible`, `revelation-iris`), à molette (`galerie-roue`) ou à gestes (`galerie-dome`, `curseur`) agiraient sur la page, et qu'un lien ne peut pas contenir d'éléments interactifs (HTML : contenu de `<a>` sans élément interactif descendant ; WCAG 4.1.2).

Constat sur « je ne vois pas l'aperçu dans les cards » : voir « Diagnostic » plus bas.

## Options

1. **Activation au clic pour tout** (`pointer-events: none` jusqu'au clic, comme les cartes embarquées de Maps ou CodePen). Règle uniforme et sûre, mais le survol et le premier clic ne marchent pas : on voit une démo, on ne la manipule pas.
2. **Tout est actif d'emblée.** Marche pour les clics et les glisser, mais une ressource à molette ou à défilement épinglé retient la page dès que la souris passe sur la case, et un clavier global (flèches, Tab) y est capté sans l'avoir demandé.
3. **Pointeur libre, molette et clavier à la page jusqu'à la prise de main** (retenue). Le survol, le clic, le glisser et la saisie marchent sans rien activer ; ce qui peut piéger la page (molette, défilement, clavier) ne passe à l'aperçu qu'après une prise de main explicite.

## Décision

Option 3, avec une règle unique pour toutes les ressources : **le pointeur est libre ; la molette, le défilement vertical et le clavier restent à la page tant que le visiteur n'a pas pris la main sur la case.**

1. **Structure de la case.** La scène (aperçu) et le pied sont frères : le lien vers la fiche ne couvre plus que le **pied** (titre, badges, repère « Voir la fiche »), jamais la scène. Un seul lien par case (le titre, `h3 > a`) : son `::after` est étiré sur le pied, le repère « Voir la fiche ↗ » est dans la même zone cliquable (`aria-hidden`, `pointer-events: none`), il n'y a donc ni lien en double ni élément interactif dans un lien. Le survol du lien (et non plus de la case) soulève la case de 2 px ; le focus clavier du lien trace un anneau autour du pied. Les cases de design (sans fiche) gardent leur icône décorative (`aria-hidden`).
2. **Aperçu interactif** (`app-apercu-vignette [interactif]`, planche seulement). `pointer-events` reste actif, la scène n'est plus `aria-hidden`, l'iframe s'intitule « Aperçu interactif de … ». Les pièces des vitrines d'accueil (hero, À propos) gardent l'aperçu décoratif de l'ADR 0015.
3. **Prise de main.** Elle a lieu quand l'iframe reçoit le focus : un clic dans l'aperçu, ou le bouton **« Manipuler l'aperçu »** de la case (seul arrêt de tabulation ajouté ; l'iframe reste en `tabindex="-1"`, donc les 19 aperçus d'une planche n'ajoutent pas leurs contrôles à la tabulation). Le bouton apparaît au survol de la scène ou au focus (visible en permanence, discret, sur écran tactile). Main prise : un cadre entoure la scène, « Échap pour quitter » s'affiche, une région `role="status"` l'annonce aux lecteurs d'écran, `aria-pressed` vaut vrai.
4. **Ce que la prise de main change** (côté aperçu, `projects/apercus/src/app/manipulation.ts`) :
   - molette : avant la prise, un écouteur de capture coupe l'événement avant ceux de la ressource, et le document de l'aperçu n'est pas défilable, donc le défilement remonte à la page (mesuré : la page défile de 200 px sous la souris, même sur `galerie-roue`) ; après la prise, la molette atteint la ressource ;
   - toucher : avant la prise, `touch-action: pan-y` est imposé aux éléments de la scène (le balayage vertical appartient à la page, le glisser horizontal reste à la ressource) ; après, la ressource retrouve ses règles ;
   - défilement : avant, `html` est en `overflow: hidden` et les ressources pilotées par le défilement (`media-extensible`, `revelation-iris`) jouent leur boucle automatique ; après, `html` défile (barre masquée), elles passent au vrai défilement (`pilotage` « défilement ») et la boucle s'arrête. À la fin de la course l'aperçu ne retient pas la page : pas de `overscroll-behavior: contain`, le défilement continue dans la page (mesuré : iframe à 494 px puis page) ;
   - clavier : le focus est dans l'aperçu, donc les raccourcis du site (⌘K) ne s'y appliquent plus tant que la main n'est pas rendue ; Tab y parcourt les contrôles de la ressource puis sort vers le bouton.
5. **Remise de la main.** Échap (le site reprend le focus sur le bouton, message `ngs-manipulation` avec `echap`), un clic en dehors, un Tab hors de l'aperçu, une fenêtre qui perd le focus, ou la case qui sort du viewport (iframe détruite). Pas de piège de focus : on peut toujours en sortir à la souris et au clavier. Échap déjà consommé par la ressource (`preventDefault`) ne rend pas la main ; une ressource qui ferme sa visionneuse sans `preventDefault` (`galerie-dome`) la rend en même temps : limite connue, acceptée.
6. **Protocole.** Un seul message ajouté, aperçu vers site : `ngs-manipulation { v: 1, type, actif: boolean, echap?: boolean }`, lu par `lireMessageVersSite` avec la même validation stricte (forme, source = fenêtre de l'iframe, origine `"null"`) ; un message mal formé est ignoré. L'aperçu reste la source de vérité : le focus est dans son document.
7. **Plafond et pause.** La pause hors viewport (destruction de l'iframe) est inchangée. Le plafond passe de **8 à 12** vignettes vivantes : à 2560 × 2200 px, 11 cases sont visibles et 8 iframes laissaient 3 icônes (RSS mesuré : environ 12 Mo par iframe, soit environ 150 Mo au plus). Une case en attente de place garde son icône et réessaie quand une place est rendue.
8. **Mouvement réduit.** Inchangé pour la lecture automatique (`animations=0` dans l'URL, état fixe). La manipulation, voulue par le visiteur, reste possible : le défilement réel d'un hero extensible fonctionne, sans lissage.
9. **Sécurité inchangée.** `sandbox="allow-scripts"` sans `allow-same-origin`, `referrerpolicy="no-referrer"`, `allow=""`, CSP du site (`frame-src 'self'`) et `Content-Security-Policy: sandbox allow-scripts; …` de `/apercu/*` : aucun changement. Le sandbox interdit toujours fenêtres, formulaires, modales et navigation du haut ; les liens de la scène restent neutralisés. Un clic dans l'iframe ne donne aucun accès au site.

## Diagnostic : « je ne vois pas l'aperçu dans les cards »

Reproduit avec `npm start` (site 4200, aperçus 4201, Chromium et Chrome stable en headless) et avec le build de production servi avec `public/_headers` : **les aperçus s'affichent** (états `pret`, aucune erreur CSP ni CORS) sur le catalogue, les catégories, l'accueil et les 19 cases, du viewport 375 à 2560 px, clair, sombre et mouvement réduit ; ni le délai de 300 ms, ni le `@defer`, ni la hauteur de scène, ni le sandbox, ni le proxy, ni les 6 galeries ne les empêchent. Le démarrage à froid (cache Vite désactivé) n'allonge pas l'attente (iframe prête en moins de 1 s). Restent trois causes réelles, corrigées ici :

- **le plafond de 8** : sur une fenêtre grande ou haute, les cases au-delà de la huitième gardent leur icône ; porté à 12 ;
- **le pointeur bloqué** : l'aperçu s'affichait mais n'était pas manipulable, ce qui se lit comme « pas un vrai aperçu » ; corrigé par la présente décision ;
- **les aperçus se recréent à chaque retour dans le viewport** (décision 3 de l'ADR 0015, conservée) : une case qu'on a quittée repasse brièvement par l'icône ; seule une iframe encore en cache HTTP rend cela quasi invisible.

Non vérifié : Safari et Firefox (aucun moteur disponible dans l'environnement de test). Un aperçu absent chez Sidy malgré ce diagnostic indiquerait un serveur des aperçus non lancé (la page « Aperçus indisponibles » du proxy s'affiche alors dans l'iframe, la case garde son icône) : `npm start` lance les deux.

## Conséquences

- Les ressources n'ont rien à faire de spécial, sauf celles pilotées par le défilement : leur scène `demo/` lit `ApercuService.manipulation()` en plus de `vignette()` (boucle ou défilement réel). Une future ressource à molette ou à défilement épinglé doit faire de même ; sinon elle ne réagit à la molette qu'après la prise de main, sans nuire à la page.
- Un tab stop de plus par case (le bouton « Manipuler l'aperçu »), et la case n'est plus un lien entier : un clic sur la scène n'ouvre plus la fiche, il manipule. Le titre, les badges et « Voir la fiche » l'ouvrent.
- La transition scène → cadre d'aperçu de la fiche (ADR 0011) part toujours du clic sur le lien du pied.
- Le budget de l'application d'aperçus gagne un petit module (`manipulation.ts`) ; celui du site, quelques dizaines d'octets de gabarit.
- Non couvert : Safari et Firefox ; la reprise de la main par un lecteur d'écran en mode navigation (le bouton et la région `status` sont les points d'entrée).

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet), `design/HANDOFF.md` §« Case de planche ». Contenu d'un lien sans élément interactif : https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element (officiel). `touch-action` : https://developer.mozilla.org/docs/Web/CSS/touch-action (référence). Chaînage du défilement entre cadres : mesuré dans Chromium (voir Diagnostic), non vérifié ailleurs.
