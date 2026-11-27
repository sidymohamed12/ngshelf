# Architecture prévue du catalogue

Prévu, non construit. Décisions : ADR 0001 à 0013, tous `accepté` au 2026-11-27 (décisions de Sidy).

## Comment une ressource devient des pages, des aperçus et des fichiers

Répond à : d'où vient chaque chose affichée ou téléchargée, et où les deux variantes se séparent.

```mermaid
flowchart LR
  subgraph Depot["Dépôt GitHub (public)"]
    TX["registry/taxonomie/<br/>types, secteurs"]
    R["registry/&lt;categorie&gt;/&lt;slug&gt;/<br/>meta.ts + .ts commun<br/>tailwind/*.html · css/*.html + .css<br/>demo/"]
    DS["registry/designs/&lt;slug&gt;<br/>valeurs des tokens --ngs-*"]
    TH["ngshelf-theme.css<br/>pont @theme inline + @utility densité"]
    S["app site Angular 22<br/>(Tailwind v4)"]
    P["app apercus Angular 22<br/>(build Tailwind propre)"]
  end
  TX --> V["validation du registre<br/>(schéma, taxonomie, dépendances vides)"]
  R --> V
  DS --> V
  V --> EQ["contrôles d'équivalence<br/>structure + visuel Playwright"]
  V --> G["script de build Node"]
  TH --> G
  G --> I["index par catégorie (lazy)"]
  G --> C["code coloré Shiki<br/>variante Tailwind dans la page<br/>variante CSS en fragment"]
  G --> Z["2 zips par ressource<br/>-tailwind · -css"]
  G --> J["JSON de registre<br/>&lt;slug&gt; · &lt;slug&gt;-css · ngshelf-theme"]
  G --> M["sitemap.xml + _redirects"]
  I --> S
  C --> S
  R --> P
  S --> B["ng build, prérendu statique<br/>catégories, types, secteurs, détails"]
  P --> B
  B --> D["dist statique unique"]
  Z --> D
  J --> D
  M --> D
  D --> H["Cloudflare Pages<br/>(prod depuis main, aperçu par PR)"]
```

## Ce que le navigateur charge

Répond à : quelles pièces tournent chez le visiteur, quelle variante est rendue où, et isolée comment.

```mermaid
flowchart TB
  V["Visiteur"] --> SP["splash (index.html)<br/>retiré après whenStable"]
  SP --> A["Accueil / listes prérendues<br/>/composants, /blocs/navbar, /secteurs/restaurant"]
  V --> DT["Détail /&lt;categorie&gt;/&lt;type&gt;/&lt;slug&gt;"]
  A --> F["filtres client : secteur, design, tags, recherche<br/>paramètres d'URL, index lazy"]
  A --> SD["aperçus Shadow DOM, @defer on viewport<br/>variante CSS"]
  A --> MO["GSAP + Lenis (accueil seulement)"]
  DT --> IF["iframe sandbox /apercu/&lt;slug&gt;<br/>variante Tailwind, 390 / 768 / 1280 px"]
  DT --> CP["sélecteur Tailwind | CSS (cookie ngs_variante)<br/>copier · zip statique · zip avec réglages"]
  DT -. "design, mode, réglages<br/>postMessage" .-> IF
  A <-. "View Transitions du router<br/>sautées si seuls les paramètres changent" .-> DT
```
