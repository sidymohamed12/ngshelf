import { Component, inject } from '@angular/core';
import { ApercuService } from '@apercus/apercu.service';
import { imagesDemo } from '@apercus/images-demo';
import {
  CarrouselTemoignagesComponent,
  LogoEntreprise,
  Temoignage,
} from '../carrousel-temoignages.component';

const IMAGES = imagesDemo('carrousel-temoignages');
const PERSONNES: readonly (readonly [string, string, string, string])[] = [
  [
    'Moussa Ba',
    'Responsable ingénierie',
    'Niayes',
    'Les nouvelles recrues trouvent leurs marques en quelques jours.',
  ],
  ['Cheikh Diop', 'Directeur technique', 'Saloum', 'Nos estimations sont enfin honnêtes.'],
  [
    'Aminata Sow',
    'Directrice produit',
    'Teranga Lab',
    'Le lundi est de nouveau consacré aux clients.',
  ],
  [
    'Ibrahima Sy',
    'Responsable ingénierie',
    'Sahel & Fils',
    'Chaque décision a sa place et sa date.',
  ],
  [
    'Khady Fall',
    'Directrice design',
    'baobab.io',
    'Design et technique partagent enfin le même plan.',
  ],
  [
    'Fatou Ndiaye',
    'Directrice des opérations',
    'Kora',
    'Les livraisons ne sont plus une surprise.',
  ],
];

const TEMOIGNAGES: readonly Temoignage[] = PERSONNES.map(
  ([nom, fonction, entreprise, citation], i) => ({
    image: IMAGES[i]?.src ?? '',
    citation,
    nom,
    fonction,
    entreprise,
    alt: `Portrait illustré de ${nom} (personnage fictif)`,
  }),
);

const LOGOS: readonly LogoEntreprise[] = [
  { nom: 'Teranga Lab', icone: 'traits' },
  { nom: 'Sahel & Fils', icone: 'aucune' },
  { nom: 'baobab.io', icone: 'carre' },
  { nom: 'Kora', icone: 'disque' },
  { nom: 'Niayes', icone: 'cube' },
  { nom: 'Saloum', icone: 'vagues' },
];

/** Scène de l'aperçu : six témoignages fictifs de six équipes, le premier au départ (non livrée). */
@Component({
  selector: 'ngs-demo',
  imports: [CarrouselTemoignagesComponent],
  template: `
    <div class="piece" style="--largeur-scene: 72rem">
      <ngs-carrousel-temoignages
        data-hote
        titre="Ceux qui planifient ici."
        texte="Teranga Lab, baobab.io et Kora gardent leurs specs, leurs feuilles de route et leurs livraisons au même endroit."
        [temoignages]="temoignages"
        [logos]="logos"
        action="Essayer gratuitement"
        routeAction="/inscription"
        lien="Lire leurs témoignages"
        routeLien="/temoignages"
        [lectureAuto]="contexte.booleen('lectureAuto', true)"
        [dureeAffichage]="contexte.nombre('dureeAffichage', 4)"
        [animations]="contexte.animations()"
      />
    </div>
  `,
})
export class DemoComponent {
  protected readonly temoignages = TEMOIGNAGES;
  protected readonly logos = LOGOS;
  protected readonly contexte = inject(ApercuService);
}
