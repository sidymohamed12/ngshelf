import { Service, afterNextRender, computed, inject, signal } from '@angular/core';
import { CookieService } from '@core/cookies/cookie.service';
import { MotionService } from '@core/motion/motion.service';
import { ThemeService } from '@core/theme/theme.service';
import { ModeApercu, MessageReglages } from '@shared/apercu/protocole';
import {
  DesignContrat,
  Surcharges,
  TokenContrat,
  VarianteLivree,
  contraste,
  genererTokensCss,
  valeursDuDesign,
} from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';

export const COOKIE_VARIANTE = 'ngs_variante';
const DUREE_COOKIE_VARIANTE_SECONDES = 31_536_000;
const DESIGN_PAR_DEFAUT = 'planche';
const CONTRASTE_AA = 4.5;

export type LargeurApercu = 'auto' | 390 | 768 | 1280;
export type PoliceReglee = 'systeme' | 'arrondie' | 'serif';

export const POLICES: Readonly<Record<PoliceReglee, string>> = {
  systeme: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  arrondie: 'ui-rounded, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
};

/** Pastilles de couleur d'action proposées (maquette ressource.js), en plus de celle du design. */
export const COULEURS_ACTION = [
  { id: 'bleu', couleur: '#1f4fd1' },
  { id: 'vert', couleur: '#0b6e4f' },
  { id: 'framboise', couleur: '#b0005e' },
  { id: 'ambre', couleur: '#8a5300' },
] as const;

export interface ReglagesVisiteur {
  readonly couleur?: string;
  readonly rayon?: number;
  readonly densite?: number;
  readonly police?: PoliceReglee;
}

/** Réglages du visiteur vers les tokens du contrat qu'ils surchargent. */
export function versSurcharges(reglages: ReglagesVisiteur): Surcharges {
  const surcharges: Partial<Record<TokenContrat, string>> = {};
  if (reglages.couleur !== undefined) surcharges['--ngs-color-action'] = reglages.couleur;
  if (reglages.rayon !== undefined) surcharges['--ngs-radius'] = `${reglages.rayon}px`;
  if (reglages.densite !== undefined) surcharges['--ngs-density'] = String(reglages.densite);
  if (reglages.police !== undefined) surcharges['--ngs-font-family'] = POLICES[reglages.police];
  return surcharges;
}

/**
 * État de la fiche, propre à chaque page (jamais partagé entre deux fiches) : design, mode, réglages,
 * variante de code. L'aperçu, le tokens.css affiché, la copie et le zip lisent les mêmes valeurs.
 * Rien n'est enregistré, sauf la variante (cookie fonctionnel `ngs_variante`).
 */
@Service({ autoProvided: false })
export class EtatFiche {
  readonly #cookies = inject(CookieService);
  readonly #motion = inject(MotionService);

  readonly fiche = signal<FicheRessource | null>(null);
  readonly design = signal(DESIGN_PAR_DEFAUT);
  readonly mode = signal<ModeApercu>(inject(ThemeService).mode());
  readonly animations = signal(true);
  readonly largeur = signal<LargeurApercu>('auto');
  readonly variante = signal<VarianteLivree>('tailwind');
  readonly reglages = signal<ReglagesVisiteur>({});

  constructor() {
    // Le prérendu ne connaît pas le cookie : la variante est lue après le premier rendu.
    afterNextRender(() => {
      if (this.#cookies.lire(COOKIE_VARIANTE) === 'css') this.variante.set('css');
    });
  }

  /** Initialise la page pour une fiche : design mis en avant, sinon Planche ; réglages remis à zéro. */
  ouvrir(fiche: FicheRessource): void {
    this.fiche.set(fiche);
    this.design.set(this.#designInitial(fiche));
    this.reglages.set({});
    this.animations.set(true);
  }

  #designInitial(fiche: FicheRessource): string {
    const voulu = fiche.meta.designsMisEnAvant?.[0] ?? DESIGN_PAR_DEFAUT;
    return fiche.designs.some((d) => d.slug === voulu) ? voulu : (fiche.designs[0]?.slug ?? voulu);
  }

  readonly designActif = computed<DesignContrat | null>(() => {
    const fiche = this.fiche();
    return fiche?.designs.find((d) => d.slug === this.design()) ?? fiche?.designs[0] ?? null;
  });

  readonly surcharges = computed(() => versSurcharges(this.reglages()));

  /** Valeurs des 12 tokens pour le design, le mode et les réglages courants. */
  readonly valeurs = computed(() => {
    const design = this.designActif();
    return design ? valeursDuDesign(design, this.mode(), this.surcharges()) : null;
  });

  readonly aDesReglages = computed(() => Object.keys(this.surcharges()).length > 0);

  readonly tokensCss = computed(() => {
    const design = this.designActif();
    const fiche = this.fiche();
    if (!design || !fiche) return '';
    return genererTokensCss({
      nomSite: 'NgShelf',
      titreRessource: fiche.meta.titre.fr,
      design,
      surcharges: this.surcharges(),
    });
  });

  /** Rapport de contraste du texte sur l'action et sa conformité AA. */
  readonly contraste = computed(() => {
    const v = this.valeurs();
    if (!v) return { rapport: 0, conforme: false };
    const rapport = contraste(v['--ngs-color-action'], v['--ngs-color-on-action']);
    return { rapport, conforme: rapport >= CONTRASTE_AA };
  });

  /** Animations réellement permises dans l'aperçu : le réglage ET le système. */
  readonly animationsPermises = computed(
    () => this.animations() && !this.#motion.mouvementReduit(),
  );

  readonly messageApercu = computed<Omit<MessageReglages, 'v' | 'type'> | null>(() => {
    const valeurs = this.valeurs();
    if (!valeurs) return null;
    return { vars: valeurs, mode: this.mode(), animations: this.animationsPermises() };
  });

  choisirVariante(variante: VarianteLivree): void {
    this.variante.set(variante);
    this.#cookies.ecrire(COOKIE_VARIANTE, variante, {
      dureeSecondes: DUREE_COOKIE_VARIANTE_SECONDES,
    });
  }

  regler(partiel: ReglagesVisiteur): void {
    this.reglages.update((actuels) => ({ ...actuels, ...partiel }));
  }

  choisirDesign(slug: string): void {
    this.design.set(slug);
    this.reglages.set({});
  }

  reinitialiser(): void {
    const fiche = this.fiche();
    if (fiche) this.ouvrir(fiche);
  }
}
