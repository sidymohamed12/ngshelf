# 0020 — Fiche : disposition compacte, sans zones vides

## Statut

proposé (2026-11-28). Amende l'ADR 0019 : remplace sa décision 1 (bandeau en deux colonnes, actions et fiche technique à droite), sa décision 3 (barre à cinq groupes) et sa décision 4 (version du code dans la barre) ; ses autres décisions restent. Écart par rapport à la maquette `design/maquette/ressource.html`, que `designer` devra reporter.

## Contexte

Sidy a regardé la fiche (ex. `/blocs/galerie/galerie-roue`) : sous le titre, à gauche, un large vide en face de la colonne des boutons et de la fiche technique ; sous l'aperçu, un vide aussi haut que le panneau de réglages de droite (le panneau, plus haut que l'aperçu, étirait la rangée) ; « Design » à deux endroits ; la version du code loin du code.

## Décision

1. **Bandeau linéaire, un seul bloc.** Badges, puis le titre avec « Copier le code » et « Télécharger le composant » sur la **même ligne** (à droite, alignés sur le bas du titre), puis la description (66 caractères au plus), puis la fiche technique en **une rangée** (Angular, Dépendances, Animations, Licence, Ajoutée le : libellé gris, valeur en gras, entre deux filets). Rien à gauche ou à droite qui laisse un vide : la hauteur passe d'environ 330 à 233 px à 1440 px. Sous 640 px : actions pleine largeur l'une sous l'autre, fiche technique en deux colonnes ; un `dl` reste un `dl` (`div` autour de chaque `dt` / `dd`). Composant `app-fiche-identite`.
2. **Aperçu et réglages à hauteur égale.** À partir de 1024 px, le panneau de réglages ne compte plus dans la hauteur de la rangée (position absolue dans son cadre) : il prend celle de l'aperçu (36 rem au moins) et défile à l'intérieur de son cadre (`overscroll-behavior: contain`). Le bloc Code suit tout de suite, sans trou. Sous 1024 px, une colonne, le panneau sous l'aperçu à sa hauteur naturelle (pleine largeur, pas de vide).
3. **Code à la hauteur de sa colonne voisine.** À partir de 1024 px, le bloc Code prend la hauteur de la colonne Utilisation / Installer / Dépendances et le code défile dans son cadre (il était plafonné à 34 rem, d'où un vide sous lui). Mesuré : hauteurs égales de 1024 à 2560 px.
4. **Version du code dans le bloc Code.** « Version du code » (Tailwind, CSS) est un `radiogroup` dans l'en-tête du bloc Code, à droite du titre. Même état (`EtatFiche.variante`), même cookie `ngs_variante`, même effet sur l'aperçu de la copie et du zip ; le bloc revient au premier onglet quand elle change.
5. **Un réglage, un seul endroit.** La barre de l'aperçu ne garde que ce qui concerne le cadre : taille, mode, « Rejouer l'entrée / la sortie » et « Ouvrir l'aperçu seul » (composant `app-barre-apercu`). **Design** et **Animations** sont retirés de la barre et restent dans le panneau de réglages, où ils sont aussi la source de l'aperçu, du zip, de `tokens.css` et de l'URL de l'aperçu seul. Raison : le panneau est le lieu des réglages de la ressource (design, couleur, rayon, densité, police, animations, paramètres) ; la barre, celui de l'écran de test. Vérifié : aucun autre réglage n'est dupliqué (taille et mode : barre seule ; version du code : bloc Code seul ; « Copier » du bloc Code copie un fichier, « Copier le code » du bandeau copie tout).
6. **Espacements.** Marges verticales réduites sous l'aperçu (de 6 et 4 rem à 2,5 et 3 rem), avant « Autres ressources » (de 6 à 4 rem).

## Conséquences

- Les deux composants extraits (`app-fiche-identite`, `app-barre-apercu`) allègent le gabarit de la page de la fiche (complexité du template).
- Mesuré à 375, 768, 1024, 1440, 1920 et 2560 px, en clair et en sombre : aucun débordement horizontal ; à 1024 px et plus, aperçu = panneau et code = colonne voisine en hauteur.
- Le panneau défilant est une région de défilement dont le contenu est focalisable : le clavier y atteint tout, le focus fait défiler le cadre.
- Choix laissé à valider : Design et Animations dans le panneau plutôt que dans la barre. Si Sidy préfère la commodité de la barre, retirer ces deux groupes du panneau (changement localisé, `reglages-fiche.component.html`).

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet), ADR 0017, 0018, 0019.
