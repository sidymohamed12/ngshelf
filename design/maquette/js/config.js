/*
  Configuration du site — LE seul endroit où vivent le nom et les liens de Sidy.
  Changer `nom` (et `prefixe` pour les sélecteurs et les tokens) suffit à renommer la maquette.
  Chemins relatifs uniquement (la maquette est publiée comme page hébergée).
*/
window.NGS = window.NGS || {};
window.NGS.site = {
  nom: 'NgShelf', // nom retenu par Sidy
  nomCourt: 'Shelf', // texte de la marque à côté du logo (le logo contient déjà « ng »)
  prefixe: 'ngs', // préfixe des tokens (--ngs-*) et des sélecteurs (ngs-*) des ressources
  depot: null, // dépôt GitHub du projet, pas encore créé : les liens « Code source » pointent vers #
  licence: 'MIT',
  angular: '22',
  langue: 'fr',
  auteur: {
    nom: 'Sidy',
    nomComplet: 'Sidy Mohamed Saizonou', // page « À propos »
    portfolio: 'https://sidy-mohamed-saizonou.netlify.app/', // cible de « Développé par Sidy »
    instagram: 'https://www.instagram.com/sidymohamed_12/',
    tiktok: 'https://www.tiktok.com/@sidymohamed_12',
    linkedin: 'https://www.linkedin.com/in/sidy-mohamed-saizonou/',
    github: 'https://github.com/sidymohamed12',
    email: 'mohamedsaizonou86@gmail.com',
    // Mentions légales (valeurs données par Sidy le 27 novembre 2026). Le téléphone n'est écrit que ici, jamais dans les pages.
    telephone: '+221 76 182 36 98', // affichage ; le lien tel: en est dérivé (chiffres seulement)
    statut: 'Particulier, développeur (éditeur non professionnel)',
    adresse: 'Dakar, Sénégal' // ville et pays seulement, pas d'adresse postale complète
  },
  // Hébergeur (mentions légales et confidentialité) : Cloudflare, confirmé par Sidy. Une seule valeur : 'cloudflare' ou 'netlify'.
  // Même valeur à reporter dans `site.config.ts` côté Angular. Coordonnées lues le 27 novembre 2026 sur les politiques de confidentialité officielles.
  hebergeur: 'cloudflare',
  hebergeurs: {
    cloudflare: { nom: 'Cloudflare, Inc.', adresse: '101 Townsend Street, San Francisco, CA 94107, États-Unis', site: 'https://www.cloudflare.com/' },
    netlify: { nom: 'Netlify, Inc.', adresse: '101 2nd Street, San Francisco, CA 94105, États-Unis', site: 'https://www.netlify.com/' }
  },
  chemins: {
    sprite: '../design-system/assets/icons/sprite.svg',
    contrat: '../design-system/contrat-tokens.css',
    tailwindNavigateur: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.5'
  }
};
