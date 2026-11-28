# 0015 — Aperçus vivants dans les cases de la planche

## Statut

proposé (2026-11-28, phase 5). Remplace la ligne « Accueil, grille du catalogue » du tableau de l'ADR 0003 (Shadow DOM, variante CSS) ; le reste de l'ADR 0003 et l'ADR 0010 sont inchangés.

## Contexte

L'ADR 0003 prévoyait, pour la planche, un rendu dans la page en Shadow DOM avec la variante CSS, sous `@defer (on viewport)`. La phase 4 n'a pas pu l'appliquer : le code des ressources vit dans le registre, compilé seulement dans l'application d'aperçus, et la planche affichait l'icône de la catégorie. Les ressources portées en phase 5 rendent le Shadow DOM inutilisable : un défilement épinglé (`scroll-expand`, `scroll-iris`) lit le défilement de la fenêtre, un dôme 3D écoute le clavier de la page, une roue prend la molette. Dans la page du site, ces comportements agiraient sur le site lui-même.

## Options

1. **Shadow DOM dans le site** (ADR 0003). Léger, mais il faut compiler les ressources dans le bundle du site (nouvelle chaîne de génération, variante CSS en plus de la variante Tailwind de l'aperçu), l'isolation n'est que visuelle (le code contribué s'exécute avec les droits du site, CSP `script-src 'self'` comprise) et les ressources à défilement épinglé ou à écoute globale ne tiennent pas dans une case.
2. **Captures statiques générées au build.** Aucun coût d'exécution, mais il faut un navigateur dans le pipeline (nouvelle dépendance), l'image est figée (le mouvement, raison d'être du catalogue, disparaît) et elle ne suit ni le mode sombre ni le design.
3. **Iframes légères de `/apercu/<slug>?vignette=1`.** Même isolation que la fiche (sandbox sans `allow-same-origin`, origine opaque, protocole de l'ADR 0010) ; l'aperçu prouve ce qui est copié ; chaque ressource décide dans sa scène comment se montrer en vignette. Coût : une application Angular par iframe.

## Décision

Option 3, avec des garde-fous contre son coût.

1. **Chargement** : `@defer (on viewport)` dans `.ngs-case__stage`, placeholder = l'icône de la catégorie (aussi le rendu prérendu et celui des designs, qui n'ont pas d'aperçu). Le composant chargé, `app-apercu-vignette`, observe sa propre visibilité (marge de 120 px) et n'ouvre l'iframe qu'après **300 ms** de présence : une case qui traverse l'écran pendant un défilement rapide ne charge rien.
2. **Plafond** : au plus **8 vignettes vivantes** à la fois (`VignettesService`). Sans place, la case garde son icône et réessaie quand une place est rendue.
3. **Pause hors viewport** : une case qui sort du viewport détruit son iframe (mémoire et processeur rendus), l'icône revient. L'app d'aperçus est en cache HTTP après la première vignette : relancer coûte peu.
4. **Mode « vignette »** de l'application d'aperçus (`?vignette=1`) : pas de barre, pas d'interaction (`pointer-events: none`, la case entière reste le lien vers la fiche), pas de mesure de hauteur. L'iframe est rendue à 520 px de large puis réduite par `transform: scale` pour tenir dans la case (jamais agrandie).
5. **Design et mode** par l'URL : le design mis en avant de la ressource (`designMisEnAvant`, ajouté à l'index), le mode clair ou sombre du site. Un changement de mode du site recharge l'iframe (pas de message : les variables posées en ligne par un design ne se défont pas avec une classe).
6. **Mouvement réduit** : `MotionService.mouvementReduit` met `animations=0` dans l'URL ; la scène et la ressource montrent alors un état fixe (aussi le cas `prefers-reduced-motion` de l'iframe elle-même).
7. **Économie de données** (`navigator.connection.saveData`) : aucune iframe, l'icône reste.
8. **Échec** : sans `ngs-pret` sous 10 s, la vignette abandonne et garde l'icône (décor, pas d'alerte : le lien vers la fiche fonctionne).
9. **Sécurité** : attributs identiques à la fiche (`sandbox="allow-scripts"`, `referrerpolicy="no-referrer"`, `allow=""`), `tabindex="-1"`, la scène est `aria-hidden`. Seul `ngs-pret` est lu, après contrôle de la fenêtre source et de l'origine `"null"`. CSP du site inchangée (`frame-src 'self'`).

## Conséquences

- LCP : l'iframe n'entre pas dans le LCP de la page parente et démarre après l'hydratation et 300 ms de visibilité ; mesuré (voir le rapport de phase) sur le catalogue en bureau et en mobile.
- Une ressource qui ne se prête pas à une case (défilement épinglé) lit `ApercuService.vignette()` et joue une boucle courte ou un état figé.
- Le catalogue grossira : si 8 places ne suffisent plus, le plafond est une constante (`VIGNETTES_SIMULTANEES_MAX`).
- Non couvert : le prérendu ne montre pas de vignette (placeholder), un visiteur sans JavaScript garde les icônes.

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet). Comportement de `@defer (on viewport)` : https://angular.dev/guide/templates/defer (officiel).
