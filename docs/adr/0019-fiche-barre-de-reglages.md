# 0019 — Fiche : identité en bandeau et barre de réglages au-dessus de l'aperçu

## Statut

proposé (2026-11-28). Écart assumé par rapport à la maquette `design/maquette/ressource.html` (trois colonnes : identité, aperçu, réglages), que `designer` devra reporter. Dépend de l'ADR 0018 (pleine largeur).

## Contexte

Sidy veut donner toute la largeur à l'aperçu : la colonne de gauche de la fiche devient une barre au-dessus de l'aperçu ; la barre latérale de droite ne change pas (contenu, rôle, position).

**Ambiguïté relevée.** Dans le code et la maquette, la colonne de gauche du haut de la fiche n'est pas celle des réglages : c'est l'**identité** (badges, titre, description, « Copier le code », « Télécharger », fiche technique). Les réglages par tokens (design, couleur, rayon, densité, police, animations, paramètres propres) sont dans le panneau de **droite**, `app-reglages-fiche`. Taille et mode sont déjà dans la barre de l'aperçu, la version du code (Tailwind ou CSS) dans l'en-tête du bloc Code. La consigne « la barre latérale de droite ne change pas » a été prise à la lettre : le panneau de réglages de droite est conservé tel quel, comme le bloc Utilisation / Installation / Dépendances sous le code.

## Décision

1. **Bandeau d'identité.** La colonne de gauche devient un bandeau sur toute la largeur, au-dessus de l'aperçu : à gauche badges, titre et description ; à droite (26 rem au plus) les boutons de copie et de téléchargement et la fiche technique ; empilé sous 1024 px. Plus de colonne collante.
2. **Aperçu élargi.** Sous le bandeau, une rangée `aperçu + panneau de réglages` : 9 fr / 3 fr à partir de 1280 px (6 fr / 3 fr auparavant, avec l'identité), 8 fr / 4 fr entre 1024 et 1279 px (inchangé), une colonne en dessous. Les tailles 390, 768 et 1280 restent des vraies largeurs d'iframe, mises à l'échelle pour tenir.
3. **Barre de réglages fréquents.** Dans la carte de l'aperçu, avant le cadre : taille (Adaptée, 390, 768, 1280), mode clair ou sombre, design (si plus d'un), interrupteur Animations, version du code (Tailwind, CSS), puis « Rejouer l'entrée / la sortie » et « Ouvrir l'aperçu seul ». Elle se replie sur plusieurs lignes dans un cadre étroit (pas de défilement horizontal de la page) ; les groupes à rangée longue défilent dans leur propre rail. Design, animations et version du code lisent et écrivent le même `EtatFiche` que le panneau de droite : un changement d'un côté se voit de l'autre.
4. **Version du code déplacée.** Le choix Tailwind / CSS quitte l'en-tête du bloc Code pour la barre (cookie `ngs_variante` inchangé) ; le bloc Code revient au premier onglet quand elle change, comme avant.
5. **Comportements conservés** : messages `ngs-reglages`, cookie `ngs_variante`, copie, zip, « Ouvrir l'aperçu seul » (mêmes paramètres d'URL), rejouer l'entrée et la sortie, Animations désactivé sans animation propre.

## Non fait, à décider

Le panneau repliable « sous la barre » pour les paramètres propres et les réglages de tokens n'est **pas** créé : ces réglages sont déjà dans le panneau de droite, que la consigne interdit de modifier, et les dupliquer ferait deux panneaux pour le même état. Si Sidy voulait au contraire déplacer le panneau de droite sous la barre (aperçu sur toute la largeur, panneau en dessous avec bouton d'expansion, `aria-expanded`), c'est un changement localisé : retirer `app-reglages-fiche` de la rangée et le monter sous la barre dans un conteneur repliable. À confirmer.

## Conséquences

- Mesuré à 375, 768, 1440 et 2560 px : aucun débordement horizontal de la page ; la barre passe sur 3 lignes à 375 px.
- Tests : la fiche place la barre dans la carte de l'aperçu avant le cadre, l'identité hors de la rangée, le panneau à droite avec ses groupes repliables.

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet), `design/maquette/ressource.html`.
