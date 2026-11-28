# 0022 — Aperçu agrandi en fenêtre modale

## Statut

proposé (2026-11-28). Remplace en partie l'ADR 0016 (page d'aperçu autonome) ; les ADR 0003 et 0010 (iframe isolée, protocole) et 0017 (prise de main des cases) restent en vigueur.

## Contexte

Sidy a essayé « Ouvrir l'aperçu seul » et n'en veut pas : pas de nouvelle page, pas d'onglet. Il veut une fenêtre dans la page qui montre l'aperçu en grand, avec les réglages en cours.

## Décision

1. **Fenêtre modale, pas de page.** Le bouton « Agrandir l'aperçu » (icône `arrows-out`, ajoutée au sprite Phosphor 2.1.1 regular) de la barre de la fiche ouvre un `<dialog>` natif par `showModal()`. Le navigateur rend le reste de la page inerte, ferme sur Échap et rend le focus au bouton ; le focus arrive sur « Fermer » à l'ouverture, un clic sur le fond ferme, et deux gardes (Maj+Tab sur « Fermer », bouton masqué après l'aperçu) gardent Tab dans la fenêtre : sans elles, Tab sortait de la page vers l'interface du navigateur. La page défile plus (`html:has(dialog[open])`).
2. **Même iframe, mêmes réglages.** La fenêtre contient un `app-apercu-frame` (iframe `sandbox="allow-scripts"`, protocole `ngs-reglages` inchangé) alimenté par l'état de la fiche (`EtatFiche.messageApercu()` : design, mode, animations, paramètres propres) et la largeur choisie (390, 768, 1280 ou adaptée). Elle ne remplace pas l'aperçu de la fiche : il n'existe qu'une iframe de plus, créée à l'ouverture et détruite à la fermeture. L'en-tête rappelle le design et le mode.
3. **Échap dans l'aperçu.** Le focus est alors dans l'iframe : l'aperçu envoie le message `ngs-manipulation { actif: false, echap: true }` (déjà défini par l'ADR 0017) quand Échap n'a pas été consommé ; la fenêtre se ferme. Hors de la fenêtre, le message est ignoré.
4. **Retraits.** Le lien `target="_blank"` « Ouvrir l'aperçu seul », `BarreAutonome`, l'état `autonome` et ses méthodes (`choisirDesign`, `choisirMode`, `choisirAnimations`, `reglerParametre`, `reinitialiser`), les styles `ap-barre`, `ap-autonome`, `ap-squelette` et les textes associés. **Conservés** : la route `/apercu/<slug>` (hôte d'iframe), la lecture de `?design=…&mode=…&animations=…&p.<nom>=…` (utilisée par les cases), l'état d'erreur et l'aperçu introuvable.
5. **Mouvement réduit.** L'ouverture ne s'anime pas quand le système demande moins de mouvement.

## Conséquences

- Budget de l'application d'aperçus : de 399 à 389 kB (la barre et ses textes disparaissent), l'avertissement de 400 kB n'est plus frôlé. Site : environ +1 kB (textes), la fenêtre est dans le chunk lazy de la fiche.
- Un aperçu en plein viewport réel (défilement de la page entière d'un hero extensible) n'est plus testable dans un onglet à part ; la fenêtre en donne l'essentiel (jusqu'à 120 rem de large).
- Non vérifié : Safari et Firefox (aucun moteur disponible dans l'environnement de test).

## Sources

Code du dépôt lu le 2026-11-28 ; comportement de `<dialog>` modal (focus, Échap, inertie) : https://developer.mozilla.org/docs/Web/HTML/Element/dialog (référence).
