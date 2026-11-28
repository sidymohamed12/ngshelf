import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { TEXTES } from '@core/i18n/textes.fr';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { MarqueComponent } from '@shared/components/marque/marque.component';
import { LIENS_FAMILLES } from './liens-navigation';

interface Reseau {
  readonly href: string;
  readonly icone: NomIcone;
  readonly libelle: string;
  /** Les liens externes s'ouvrent dans un nouvel onglet ; l'adresse e-mail non. */
  readonly externe: boolean;
}

const { auteur } = SITE;

const RESEAUX: readonly Reseau[] = [
  {
    href: auteur.instagram,
    icone: 'instagram-logo',
    libelle: TEXTES.pied.instagram,
    externe: true,
  },
  { href: auteur.tiktok, icone: 'tiktok-logo', libelle: TEXTES.pied.tiktok, externe: true },
  { href: auteur.linkedin, icone: 'linkedin-logo', libelle: TEXTES.pied.linkedin, externe: true },
  { href: auteur.github, icone: 'github-logo', libelle: TEXTES.pied.github, externe: true },
  {
    href: `mailto:${auteur.email}`,
    icone: 'envelope-simple',
    libelle: TEXTES.pied.email,
    externe: false,
  },
];

@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconeComponent, MarqueComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected readonly textes = TEXTES;
  protected readonly familles = LIENS_FAMILLES;
  protected readonly reseaux = RESEAUX;
  protected readonly depot = SITE.depot;
  protected readonly portfolio = auteur.portfolio;
  protected readonly nomAuteur = auteur.nom;
}
