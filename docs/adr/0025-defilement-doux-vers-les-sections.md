# 0025 — Défilement doux vers les sections de la page

## Statut

proposé (2026-11-28). Complète l'ADR 0011 (mouvement réduit, Lenis sur l'accueil et « À propos »).

## Contexte

Les boutons qui mènent à une section de la même page (« Lire comment démarrer », « Voir les trois gestes ») sautaient : le routeur défilait lui-même vers l'ancre (`anchorScrolling: 'enabled'`, saut instantané).

## Décision

1. `DefilementService` (`core/motion`) écoute l'événement `Scroll` du routeur et rejoint l'ancre. `anchorScrolling` passe à `disabled`, et les liens de section portent `scroll="manual"` : sans cela, le routeur remet la page en haut avant que le service ne glisse.
2. Avec Lenis actif (accueil, « À propos »), `lenis.scrollTo(position chiffrée)` (1,1 s), après `lenis.resize()` (la limite de Lenis datait de sa création) et recalage à l'arrivée ; sans Lenis, `window.scrollTo({ behavior: 'smooth' })`. Une position chiffrée et non l'élément : Lenis retranche lui-même la `scroll-margin-top` de la section (mesuré : 72 px de trop).
3. `prefers-reduced-motion` (lu par `MotionService`) : saut instantané. Arrivée sur une autre page, premier chargement avec `#section` ou lien vers la section déjà dans l'adresse : saut aussi.
4. Le décalage est celui du header collé (hauteur mesurée + 16 px) ou de la `scroll-margin-top` si elle est plus grande ; la section reçoit `tabindex="-1"` et le focus sans défilement ; l'adresse porte le `#fragment` (navigation du routeur).
5. `LienSectionDirective` (`a[routerLink][fragment]`) : si l'adresse porte déjà le fragment, le routeur ignore le clic ; la section est alors rejointe directement.
6. Prérendu : aucun effet (le service n'agit qu'avec `window`).

## Conséquences

- Un nouveau lien de section doit porter `scroll="manual"` et la directive (`LienSectionDirective`).
- Mesuré (Chromium) : 66 positions intermédiaires et arrivée à 85 px sous le haut (header de 69 px) ; en mouvement réduit, 1 saut ; `/#demarrer` au chargement : arrivée correcte.
