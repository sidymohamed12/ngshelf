# Flux prévu — page de détail : choisir une variante, régler, copier, télécharger

Prévu, non construit. Décisions : ADR 0002 (variantes, distribution), 0003 (aperçus), 0005 (transitions).

## Cas nominal

```mermaid
sequenceDiagram
  actor U as Visiteur
  participant L as Liste prérendue
  participant D as Page de détail (site)
  participant K as Cookie ngs_variante
  participant F as Fichiers statiques
  participant I as iframe /apercu/<slug>

  U->>L: clic sur une case
  L->>D: navigation router (View Transition : sortie liste, entrée détail)
  D->>K: lire la variante (défaut : tailwind)
  D->>I: charger l'aperçu (variante Tailwind)
  I-->>D: message « prêt »
  U->>D: choisir le design Fleuve, mode sombre, densité 1.2
  D->>I: postMessage { design, mode, réglages }
  Note over D: le bloc de valeurs (tokens.css) se met à jour, lignes modifiées en surbrillance
  U->>D: basculer sur « CSS »
  D->>K: écrire ngs_variante=css
  D->>F: GET fragment du code coloré, variante CSS (une fois)
  F-->>D: HTML coloré
  U->>D: « Copier avec mes réglages »
  D->>U: presse-papiers : fichiers de la variante CSS + bloc de valeurs
  U->>D: « Télécharger »
  alt sans réglage modifié
    D->>F: GET <slug>-css.zip
    F-->>U: zip statique
  else avec réglages
    D->>D: import() de la bibliothèque zip, assemblage dans le navigateur
    D-->>U: zip généré
  end
```

## Cas d'erreur principaux

- **Presse-papiers refusé** (permission, contexte non sécurisé) : message « Copie impossible, sélectionnez le code » et sélection automatique du bloc de code ; aucune erreur silencieuse.
- **Fragment de code ou zip injoignable** (hors ligne, 404 après déploiement) : état `hors-ligne` ou `erreur` de `angular-sidy` §4 sur la zone de code, bouton « Réessayer » ; le sélecteur revient à la variante affichée.
- **Aperçu qui ne répond pas** (pas de message « prêt » après un délai fixé en constante) : la zone d'aperçu affiche l'état `erreur` avec « Recharger l'aperçu » ; le code reste copiable.
- **Message d'une autre source** : ignoré. Côté site, `event.source` doit être la fenêtre de l'iframe (l'origine d'une iframe sandbox sans `allow-same-origin` vaut `null`, elle ne peut pas servir de contrôle) ; côté aperçu, l'origine du site est vérifiée.
- **Cookie absent ou valeur inconnue** : variante Tailwind.
