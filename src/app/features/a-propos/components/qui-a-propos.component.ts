import { IMAGE_LOADER, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { SITE } from '@core/config/site.config';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { chargeurImages } from './comment-a-propos.component';

interface LienAuteur {
  readonly libelle: string;
  readonly icone: NomIcone;
  readonly href: string;
  /** Texte lisible sous le nom du lien : l'adresse sans protocole, ou l'e-mail. */
  readonly detail: string;
  readonly externe: boolean;
}

function sansProtocole(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

const AUTEUR = SITE.auteur;

/** Liens de l'auteur : lus dans `SITE.auteur`, jamais recopiés dans la page. */
const LIENS: readonly LienAuteur[] = [
  {
    libelle: TEXTES_APROPOS.lienPortfolio,
    icone: 'browser',
    href: AUTEUR.portfolio,
    detail: sansProtocole(AUTEUR.portfolio),
    externe: true,
  },
  {
    libelle: TEXTES_APROPOS.lienGithub,
    icone: 'github-logo',
    href: AUTEUR.github,
    detail: sansProtocole(AUTEUR.github),
    externe: true,
  },
  {
    libelle: TEXTES_APROPOS.lienLinkedin,
    icone: 'linkedin-logo',
    href: AUTEUR.linkedin,
    detail: sansProtocole(AUTEUR.linkedin),
    externe: true,
  },
  {
    libelle: TEXTES_APROPOS.lienInstagram,
    icone: 'instagram-logo',
    href: AUTEUR.instagram,
    detail: sansProtocole(AUTEUR.instagram),
    externe: true,
  },
  {
    libelle: TEXTES_APROPOS.lienTiktok,
    icone: 'tiktok-logo',
    href: AUTEUR.tiktok,
    detail: sansProtocole(AUTEUR.tiktok),
    externe: true,
  },
  {
    libelle: TEXTES_APROPOS.lienEmail,
    icone: 'envelope-simple',
    href: `mailto:${AUTEUR.email}`,
    detail: AUTEUR.email,
    externe: false,
  },
];

/** « Qui le développe » : bande sombre forcée (`data-theme="sombre"`), portrait, nom et liens en cartes. */
@Component({
  selector: 'app-qui-a-propos',
  imports: [NgOptimizedImage, IconeComponent],
  providers: [{ provide: IMAGE_LOADER, useValue: chargeurImages }],
  templateUrl: './qui-a-propos.component.html',
})
export class QuiAProposComponent {
  protected readonly t = TEXTES_APROPOS;
  protected readonly nom = AUTEUR.nom;
  protected readonly nomComplet = AUTEUR.nomComplet;
  protected readonly liens = LIENS;
}
