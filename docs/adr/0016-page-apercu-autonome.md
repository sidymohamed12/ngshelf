# 0016 — Page d'aperçu autonome

## Statut

remplacé en partie par l'ADR 0022 (2026-11-28) : la page autonome, sa barre et le lien « Ouvrir l'aperçu seul » sont retirés ; la route `/apercu/<slug>` comme hôte d'iframe et la lecture de l'état initial dans l'URL (design, mode, animations, paramètres) restent. Statut d'origine : proposé (2026-11-28, phase 5). Complète les ADR 0003 et 0010 ; le HANDOFF et la maquette ne prévoient pas cette page (ils décrivent seulement l'iframe de la fiche).

## Contexte

Sidy demande « la page de l'aperçu séparé ». L'application d'aperçus servait `/apercu/<slug>` comme simple hôte d'iframe : ouvert seul, le document montrait une scène nue, sans retour à la fiche, sans réglage et sans état d'erreur. Interprétation retenue : la page plein écran de l'aperçu d'une ressource, ouverte dans un nouvel onglet depuis la fiche (utile pour tester un vrai viewport, un défilement ou un mouvement qu'un cadre de 28 rem montre mal).

## Décision

1. **Même route, deux présentations.** `/apercu/<slug>` détecte au premier rendu dans le navigateur qu'elle est le document de plus haut niveau (`window.parent === window`). Dans une iframe, rien ne change. Ouverte seule, elle ajoute une barre (`BarreAutonome`) : lien « Retour à la fiche », design, clair/sombre, animations, « Réinitialiser » et les paramètres propres de la ressource (ADR 0014). Le HTML prérendu reste celui de l'iframe : la barre apparaît après le chargement du script (la page est `noindex`).
2. **État initial par l'URL.** La fiche ajoute un lien « Ouvrir l'aperçu seul » (`target="_blank"`, `rel="noopener noreferrer"`) dont l'adresse reprend le design, le mode, les animations, les réglages de couleur, rayon, densité et police, et les paramètres propres (`?design=fleuve&mode=sombre&p.orientation=vertical`). Le format est dans `shared/apercu/reglages-url.ts`, lu et écrit par le même code des deux côtés ; chaque valeur est validée (slug, mode, hexadécimal à 6 chiffres, rayon entier de 0 à 24, densité de 0,5 à 2, police de la liste, paramètres résolus sur leur définition). L'URL ne sert qu'à l'état initial : elle n'est pas réécrite quand on règle dans la page (le `history.replaceState` d'un document sandboxé n'est pas garanti).
3. **Design et mode sans message.** Les designs du registre sont générés dans l'application d'aperçus (`DESIGNS_APERCUS`) ; la page calcule les 12 variables avec `valeursDuDesign`, le même code que la fiche. Sans design ni réglage, le `tokens.css` livré s'applique seul.
4. **États.** Chargement (`role="status"`) pendant une navigation interne, erreur si la scène ne se charge pas (`role="alert"`, « Recharger la page »), ressource inconnue (route `**`, lien vers le catalogue). Sur un hôte statique, un slug inconnu reçoit la 404 de l'hôte : la route `**` ne sert qu'à une navigation interne.
5. **Mouvement réduit.** Le système qui demande moins de mouvement coupe les animations de la page et grise l'interrupteur, avec l'explication. Les liens de la scène restent neutralisés ; seuls les liens marqués `data-sortie` (barre, état « introuvable ») naviguent.
6. **Sécurité inchangée.** L'en-tête `Content-Security-Policy: sandbox allow-scripts` s'applique aussi à la page ouverte seule : origine opaque, aucun cookie ni stockage, aucune connexion sortante. Le lien de retour est une navigation du document lui-même, permise sans `allow-top-navigation`.

## Conséquences

- Budget initial de l'application d'aperçus : avertissement relevé de 350 à 400 kB (erreur inchangée à 500 kB). La barre, la table des designs et le calcul des valeurs ajoutent environ 19 kB bruts (361 kB mesurés contre 342).
- Les textes de la page sont dans `projects/apercus/src/app/textes.ts` : l'application d'aperçus n'embarque pas `$localize`.
- À vérifier au premier déploiement : que la navigation de retour depuis le document sandboxé fonctionne sur Cloudflare comme en local.

## Sources

Fichiers du dépôt lus le 2026-11-28 (officiel : code du projet).
