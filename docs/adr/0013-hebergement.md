# 0013 — Hébergement du site statique

## Statut

accepté (2026-11-27, décisions de Sidy). Sidy retient Cloudflare ; le choix entre Pages et Workers Static Assets se fait au lot 5. L'ADR 0001 reçoit un renvoi vers 0013 pour l'hébergeur ; son corps n'est pas réécrit.

## Contexte

Site statique prérendu, déployé à chaque PR fusionnée, qui sert aussi des zips et des JSON. CSP stricte dans `_headers`. Le front a `public/_headers` (syntaxe Cloudflare, `!`), une CI sans déploiement, un README qui dit Cloudflare Pages.

## Options

1. **Cloudflare Pages** (gratuit) : 500 builds/mois, 20 000 fichiers, 25 MiB/fichier, `_headers` 100 règles, `_redirects` 2 000 ; pas de limite de bande passante indiquée. Coût : Cloudflare oriente les nouveaux projets vers Workers Static Assets.
2. **Cloudflare Workers Static Assets** : même `_headers` (100 règles, `!`) et `_redirects`. Coûts : limites de fichiers gratuites et aperçus de PR à vérifier ; recommandé par Cloudflare pour les nouveaux projets.
3. **Netlify** (gratuit) : 300 crédits/mois pour tout (déploiement de production 15 crédits, bande passante 20 crédits/Go : ≈ 20 déploiements ou ≈ 15 Go), aperçus de PR illimités, statistiques non incluses. Coût : quota serré pour un catalogue qui déploie souvent et sert des zips ; `!` à vérifier.

## Décision (recommandée)

**Cloudflare.** Choix entre l'option 1 et 2 **au lot 5** (CI), après vérification des limites de Static Assets (fichiers, aperçus par PR). Garder `_headers` portable. Netlify écarté pour le quota.

## Conséquences

- Aucune étape de déploiement n'existe encore : rien à migrer.
- Les statistiques sans cookie (Cloudflare Web Analytics) restent à vérifier avant d'être citées dans la politique de confidentialité.

## Sources

Consultées le 2026-11-27. Limites Pages : https://developers.cloudflare.com/pages/platform/limits/ (officiel). `_headers` Static Assets : https://developers.cloudflare.com/workers/static-assets/headers/ (officiel). Migration Pages vers Workers : https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/ (officiel, résumé ; date de fin de Pages non trouvée). Netlify : https://www.netlify.com/pricing/ (officiel).
