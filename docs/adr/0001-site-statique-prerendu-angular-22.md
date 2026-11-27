# 0001 — Site 100 % statique prérendu en Angular 22, hébergé gratuitement

## Statut

Hébergeur : Cloudflare confirmé par Sidy (2026-11-27) ; Pages ou Workers Static Assets à trancher au lot 5, voir l'ADR 0013 (accepté). Le reste est inchangé.

accepté (2026-11-26, validation de Sidy relayée par le coordinateur) : Angular 22, prérendu statique, Cloudflare Pages gratuit.

## Contexte

Catalogue public de ressources Angular, sans compte, sans achat, sans back-office (`design/brief.md`). Le contenu change au rythme des PR sur le dépôt, pas au rythme des visiteurs. Il faut un bon référencement (chaque ressource est une page à indexer), un premier affichage rapide malgré une motion riche, et un hébergement gratuit.

Le brief parle d'Angular 21. La version stable actuelle est Angular 22 (documentation officielle construite en v22.3.0) ; Angular passe à un cycle majeur de 12 mois et la v23 est attendue vers juin 2027. Le skill `angular-sidy` est écrit pour Angular 21 : partir en 22 est un écart assumé vers une version plus récente, et toutes ses autres règles s'appliquent.

## Options

1. **Prérendu statique (`outputMode: "static"`)** : toutes les routes, y compris `/<categorie>/<slug>` via `getPrerenderParams`, sont générées en HTML au build. Aucun serveur Node.
   - Avantages : HTML complet pour les robots et l'aperçu de partage, hébergement statique gratuit, rien à exploiter, aucune surface d'attaque serveur.
   - Coûts : chaque ajout de ressource demande un build (quelques minutes en CI) ; pas de contenu dynamique côté serveur (pas besoin ici).
2. **SSR avec serveur Node** (`outputMode: "server"`).
   - Avantages : rendu à la demande.
   - Coûts : un serveur à héberger et surveiller, sans gain puisque tout le contenu est connu au build.
3. **SPA sans prérendu.**
   - Avantages : la plus simple à configurer.
   - Coûts : SEO limité (rendu côté client), premier affichage plus lent ; mauvais choix pour un catalogue qui vit de la recherche.

Hébergeur (pour l'option 1) :

| Hébergeur | Avantages | Coûts |
| --- | --- | --- |
| **Cloudflare Pages** | gratuit, 500 builds / mois, 20 000 fichiers et 25 MiB par fichier ; en-têtes `_headers` ; aperçu par PR | limite de fichiers à surveiller (≈ 4 à 5 fichiers par ressource : page, aperçu, zip, JSON) |
| Netlify | connu du skill (`_redirects`, `_headers`), aperçu par PR | conditions du plan gratuit à revérifier au moment du choix |
| GitHub Pages | gratuit, intégré au dépôt | pas d'en-têtes HTTP personnalisés (CSP, cache) ; pas d'aperçu par PR natif |

## Décision

Option 1, **Angular 22** (et non 21, validé), prérendu statique complet, site en **français** en v1 (`lang="fr"`, anglais plus tard), hébergé sur **Cloudflare Pages** (plan gratuit).

## Conséquences

- Aucun back-end : ni Spring Boot, ni base, ni Flyway. Les agents `backend-dev`, `reviewer` (Java), `security-reviewer` (back-end) et `pentest-actif` ne sont pas dans la chaîne. Aucun agent de la chaîne ne relit le code Angular : à signaler à Sidy.
- Tout code navigateur (GSAP, Lenis, Three.js, `navigator.clipboard`, `matchMedia`) est créé dans `afterNextRender()` et nettoyé dans `DestroyRef.onDestroy` ; rien ne doit casser le prérendu.
- Le build CI génère aussi `sitemap.xml` depuis le registre (ADR 0002).
- En-têtes de sécurité et de cache dans `public/_headers` (cache long sur les fichiers hachés, pas de cache sur le HTML, CSP).
- Splash au chargement et transitions de page : [ADR 0005](0005-splash-transitions-de-page.md).
- Anglais plus tard : textes du site marqués `i18n` dès la v1 et textes du registre au format `{ fr, en? }` (ADR 0004), pour qu'un second build `/en/` soit un ajout et non une reprise ; décision détaillée dans un futur ADR.
- Le skill décrit Netlify : un déploiement Cloudflare se configure selon la doc Cloudflare, le reste du skill s'applique tel quel.

## Sources

Consultées le 2026-11-26.

- Angular, guide SSR / prérendu (`outputMode: "static"`, `RenderMode.Prerender`, `getPrerenderParams`), doc v22.3.0 : https://angular.dev/guide/ssr (officiel)
- Calendrier Angular 22 et passage au cycle de 12 mois : https://endoflife.date/angular et https://angular.love/angular-new-release-cycle-release-schedule-change-explained (retour d'expérience, concordant ; à recouper avec https://angular.dev/reference/releases)
- Limites Cloudflare Pages, plan gratuit : https://developers.cloudflare.com/pages/platform/limits/ (officiel)
