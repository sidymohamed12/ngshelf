# 0018 — Pages en pleine largeur

## Statut

proposé (2026-11-28). Écart assumé par rapport à `DESIGN.md` (« Conteneur : `--container-site: 90rem` », « à partir de 1920 px, `--container-wide` ») et au HANDOFF (ligne « Espacement, conteneur »), que `designer` devra reporter.

## Contexte

Sidy demande que toutes les pages (en-tête, pied, accueil, À propos, catalogue, catégories, fiche) occupent toute la largeur de la fenêtre. Le conteneur `.ngs-container` plafonnait à 90 rem (1440 px), puis 112 rem à partir de 1920 px ; au-delà, de larges marges vides.

## Décision

1. **Un seul réglage.** `--container-site` vaut `none` (plus de largeur maximale), `--container-wide` disparaît. La bordure de la page est la gouttière latérale `--space-inline` (`clamp(1rem, 0.5rem + 3vw, 3rem)`), déjà responsive ; aucune valeur en dur dans les gabarits. Tout ce qui est dans `.ngs-container` (en-tête, pied, méga-menu, sections, pages) suit.
2. **Lisibilité.** Le texte courant garde sa mesure : chapeaux, descriptions et paragraphes ont déjà `max-width` en `ch` (13 à 52 ch) ou `--container-prose` (42 rem) ; ils ne s'étirent pas. Ce sont les planches, aperçus, barres d'outils et en-têtes qui profitent de la largeur.
3. **Planches.** Au lieu d'étirer les cases, elles gagnent des colonnes : planche générale 5 colonnes à 1920 px et 6 à 2560 px ; planche du catalogue (avec filtres) 5 colonnes à 2240 px et 6 à 2560 px. La planche de l'accueil, composée à la main pour 4 colonnes (`DISPOSITION_PLANCHE`), reste à 4 colonnes, plus larges.
4. **Page d'aperçu autonome.** Sa barre occupe déjà toute la largeur ; la scène garde la largeur propre de la ressource (`--largeur-scene`, 44 rem pour un composant) : un composant étiré à 2560 px ne montrerait plus son rendu réel. Inchangée.

## Conséquences

- Mesuré à 375, 768, 1024, 1440, 1920 et 2560 px, en clair et en sombre : aucun débordement horizontal de la page.
- À 2560 px, les lignes de texte hors `ch` (aucune relevée) et les panneaux « Quatre familles » (piste horizontale) restent lisibles ; le hero d'accueil place sa vitrine très à droite, avec plus de vide entre le titre et elle : point à valider visuellement par Sidy.
- La fiche prend toute la largeur ; son aperçu, encadré par la colonne de réglages et la barre latérale, reste étroit : voir l'ADR 0019.

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet).
