import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { MotionService } from '@core/motion/motion.service';
import { ThemeService } from '@core/theme/theme.service';
import { FragmentCodeService } from '@features/ressource/services/fragment-code.service';
import { ChoixSegmentComponent } from '@shared/components/choix-segment/choix-segment.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { colorer } from '@shared/livraison/colorer';
import { ValeursContrat, valeursDuDesign } from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import {
  DESIGNS,
  LIGNES_EXTRAIT_HTML,
  LIGNES_EXTRAIT_TS,
  NOMS_DESIGNS,
  PIECES_HABIT,
  PIECE_NOTIFICATIONS,
} from '../a-propos.donnees';

const IMAGES = { 'lagos-code': [640, 1024], sidy: [360, 540] } as const;
const SUITE = '\n  …';
const DELAI_DEMO_MS = 700;

/** Le fichier d'une image : `<nom>-<largeur>.webp` dans public/images/ (WebP 640 et 1024 px pour la photo). */
export function chargeurImages(config: ImageLoaderConfig): string {
  const largeurs = IMAGES[config.src as keyof typeof IMAGES] ?? [];
  const largeur = config.width ?? largeurs[largeurs.length - 1];
  return `/images/${config.src}-${largeur}.webp`;
}

interface Point {
  readonly icone: NomIcone;
  readonly texte: string;
}

const POINTS: readonly Point[] = [
  { icone: 'code', texte: TEXTES_APROPOS.comment1 },
  { icone: 'rows', texte: TEXTES_APROPOS.comment2 },
  { icone: 'sliders-horizontal', texte: TEXTES_APROPOS.comment3 },
  { icone: 'wave-sine', texte: TEXTES_APROPOS.comment5 },
];

/**
 * « Comment c'est fait » : une photo, un panneau posé dessus et quatre points. Chaque point montre un panneau
 * en vrai : le code (extrait du vrai fichier), la version Tailwind ou CSS, les trois designs, l'interrupteur
 * d'animations. Choisi au clic (clavier compris) ; la page le fait aussi suivre le défilement à partir de
 * 1024 px (`point` est un `model`). Les panneaux sont empilés dans la même cellule : hauteur constante.
 */
@Component({
  selector: 'app-comment-a-propos',
  imports: [NgOptimizedImage, IconeComponent, ChoixSegmentComponent, PieceVitrineComponent],
  providers: [{ provide: IMAGE_LOADER, useValue: chargeurImages }],
  templateUrl: './comment-a-propos.component.html',
})
export class CommentAProposComponent {
  readonly fiche = input.required<FicheRessource | null>();
  /** Point actif (0 à 3). */
  readonly point = model(0);

  protected readonly t = TEXTES_APROPOS;
  protected readonly textesFiche = TEXTES_FICHE;
  protected readonly points = POINTS;
  protected readonly pieces = PIECES_HABIT.slice(0, 2);
  protected readonly notifications = PIECE_NOTIFICATIONS;
  protected readonly optionsVersion = [
    { valeur: 'tailwind', libelle: TEXTES_FICHE.code.tailwind },
    { valeur: 'css', libelle: TEXTES_FICHE.code.css },
  ];
  protected readonly optionsDesign = DESIGNS.map((valeur) => ({
    valeur,
    libelle: NOMS_DESIGNS[valeur],
  }));
  protected readonly animationsPermises = signal(true);
  protected readonly version = signal<'tailwind' | 'css'>('tailwind');
  protected readonly design = signal<string>('planche');
  readonly #fragments = inject(FragmentCodeService);
  readonly #mode = inject(ThemeService).mode;
  readonly #motion = inject(MotionService);
  readonly #fragmentCss = signal<string | null>(null);
  #demoVersionFaite = false;
  #demoDesignFaite = false;

  protected readonly extraitTs = computed(() => {
    const code = this.fiche()?.fichiers.find((f) => f.langage === 'ts')?.code;
    if (!code) return '';
    const lignes = code
      .split('\n')
      .filter((ligne) => !ligne.startsWith('import') && ligne.trim() !== '');
    return colorer(lignes.slice(0, LIGNES_EXTRAIT_TS).join('\n') + SUITE, 'ts');
  });
  protected readonly nomFichierHtml = computed(() =>
    this.version() === 'css' && this.#fragmentCss()
      ? 'interrupteur.component.html'
      : (this.fiche()?.fichiers.find((f) => f.langage === 'html')?.nom ?? ''),
  );
  protected readonly extraitHtml = computed(() => {
    const css = this.version() === 'css' ? this.#fragmentCss() : null;
    const code = css ?? this.fiche()?.fichiers.find((f) => f.langage === 'html')?.code;
    if (!code) return '';
    return colorer(code.split('\n').slice(0, LIGNES_EXTRAIT_HTML).join('\n') + SUITE, 'html');
  });
  protected readonly nomFichierTs = computed(
    () => this.fiche()?.fichiers.find((f) => f.langage === 'ts')?.nom ?? '',
  );
  protected readonly reglages = computed<ValeursContrat | undefined>(() => {
    const definition = this.fiche()?.designs.find((d) => d.slug === this.design());
    return definition ? valeursDuDesign(definition, this.#mode()) : undefined;
  });
  protected readonly animationsEffectives = computed(
    () => this.animationsPermises() && !this.#motion.mouvementReduit(),
  );

  constructor() {
    // Le point change au clic ou au défilement : la démonstration de son panneau se joue la première fois.
    effect(() => this.#demonstration(this.point()));
  }

  protected choisir(index: number): void {
    this.point.set(index);
  }

  /** Petite démonstration à la première arrivée : la version bascule en CSS, puis le design passe à Fleuve. */
  #demonstration(index: number): void {
    if (index === 1 && !this.#demoVersionFaite) {
      this.#demoVersionFaite = true;
      setTimeout(() => void this.choisirVersion('css'), DELAI_DEMO_MS);
    }
    if (index === 2 && !this.#demoDesignFaite) {
      this.#demoDesignFaite = true;
      setTimeout(() => this.design.set('fleuve'), DELAI_DEMO_MS);
    }
  }

  protected async choisirVersion(valeur: string): Promise<void> {
    const version = valeur === 'css' ? 'css' : 'tailwind';
    this.version.set(version);
    const slug = this.fiche()?.meta.slug;
    if (version !== 'css' || !slug || this.#fragmentCss()) return;
    try {
      const fragment = await this.#fragments.charger(slug);
      this.#fragmentCss.set(fragment.fichiers.find((f) => f.langage === 'html')?.code ?? null);
    } catch {
      // Le fragment CSS est un confort ici : on reste sur l'extrait Tailwind (la fiche a son propre état d'erreur).
      this.version.set('tailwind');
    }
  }

  protected basculerAnimations(permises: boolean): void {
    this.animationsPermises.set(permises);
  }
}
