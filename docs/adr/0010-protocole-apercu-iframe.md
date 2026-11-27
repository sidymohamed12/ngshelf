# 0010 — Aperçu en iframe isolée : sandbox, `postMessage`, en-têtes

## Statut

proposé (2026-11-27). Précise l'ADR 0003. Arbitrage : point 12.

## Contexte

La maquette monte l'aperçu en `srcdoc`, avec `postMessage(…, '*')` et des messages `ngs-tokens`, `ngs-pret`, `ngs-sortie`, `ngs-sortie-fin`. Le plan en nomme d'autres (`reglages`, `pret`, `hauteur`). En production, l'aperçu est l'app `apercus` sous `/apercu/<slug>`, iframe `sandbox="allow-scripts"` sans `allow-same-origin` : origine **opaque** (`"null"`), exécutant du code contribué.

## Décision

1. `<iframe src="/apercu/<slug>" sandbox="allow-scripts" referrerpolicy="no-referrer" allow="" loading="lazy" title="…">`. Jamais `srcdoc`.
2. **Envoi** : `'*'` comme `targetOrigin` (obligatoire avec une origine opaque), sans secret dans les messages.
3. **Réception côté site** : `e.source === iframe.contentWindow`, `e.origin === 'null'`, forme valide.
4. **Réception côté aperçu** : `e.source === window.parent` et `e.origin` dans la liste d'origines du site fournie au build (production, localhost, domaine d'aperçu de PR).
5. **Format** : union discriminée typée, `{ v: 1, type }`, partagée par les deux apps : `ngs-reglages` (site vers aperçu : `vars`, `mode`, `animations`), `ngs-sortie` (classes), `ngs-pret`, `ngs-sortie-fin`, `ngs-hauteur` (aperçu vers site). Un type inconnu est ignoré.
6. **Liste blanche** : seules les 12 clés `--ngs-*` du contrat sont posées (`style.setProperty`) ; valeur ≤ 120 caractères sans `url(`, `;`, `{`, `}`, `@` ; `mode` ∈ {`clair`, `sombre`} ; `animations` booléen.
7. **En-têtes `/apercu/*`** : `Content-Security-Policy: sandbox allow-scripts` en plus de `script-src 'self'` (`!` pour remplacer la CSP du site) ; `Access-Control-Allow-Origin: *` sur les scripts et polices de l'app d'aperçus (une origine opaque les charge en mode CORS). **Non testé : à vérifier au premier aperçu.** App `apercus` servie sous `/apercu/` (`baseHref`) ; règle `/fonts/*` pour les polices.

## Conséquences

- Maquette inchangée (montage) ; le HANDOFF §7.3 et §12 reprend ces noms.
- Test Playwright : un message d'une autre fenêtre, de forme invalide ou avec une clé hors liste n'a aucun effet.
- Cloudflare : les règles `_headers` qui correspondent s'additionnent ; deux CSP donneraient leur intersection.

## Sources

Consultées le 2026-11-27. `_headers` (concaténation, `!`) : https://developers.cloudflare.com/workers/static-assets/headers/ (officiel). Comportement de l'origine opaque : connaissance générale des standards web, non revérifiée dans cette passe.
