import { Service, afterNextRender, computed, inject, signal } from '@angular/core';
import { CookieService } from '@core/cookies/cookie.service';
import { MotionService } from '@core/motion/motion.service';
import { ThemeService } from '@core/theme/theme.service';
import { parametresParDefaut, resoudreParametres } from '@shared/apercu/parametres';
import { ModeApercu, ReglagesEnvoyes } from '@shared/apercu/protocole';
import { ReglagesVisiteur, versSurcharges } from '@shared/apercu/reglages-url';
import {
  DesignContrat,
  VarianteLivree,
  contraste,
  genererTokensCss,
  valeursDuDesign,
} from '@shared/livraison/livraison';
import { FicheRessource } from '@shared/models/fiche.model';
import { ParametreReglable, ValeurParametre } from '@shared/models/parametre.model';

export { POLICES, versSurcharges } from '@shared/apercu/reglages-url';
export type { PoliceReglee, ReglagesVisiteur } from '@shared/apercu/reglages-url';

export const COOKIE_VARIANTE = 'ngs_variante';
const DUREE_COOKIE_VARIANTE_SECONDES = 31_536_000;
const DESIGN_PAR_DEFAUT = 'planche';
const CONTRASTE_AA = 4.5;

export type LargeurApercu = 'auto' | 390 | 768 | 1280;

/** Pastilles de couleur d'action proposées (maquette ressource.js), en plus de celle du design. */
export const COULEURS_ACTION = [
  { id: 'bleu', couleur: '#1f4fd1' },
  { id: 'vert', couleur: '#0b6e4f' },
  { id: 'framboise', couleur: '#b0005e' },
  { id: 'ambre', couleur: '#8a5300' },
] as const;

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
  /** Valeurs des paramètres propres de la ressource (ADR 0014), toujours résolues sur leur définition. */
  readonly parametres = signal<Readonly<Record<string, ValeurParametre>>>({});

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
    this.parametres.set(parametresParDefaut(fiche.meta.parametres ?? []));
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

  /** Paramètres propres réglables de la ressource ouverte (vide si elle n'a que les 12 tokens). */
  readonly definitionsParametres = computed<readonly ParametreReglable[]>(
    () => this.fiche()?.meta.parametres ?? [],
  );

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

  readonly messageApercu = computed<ReglagesEnvoyes | null>(() => {
    const valeurs = this.valeurs();
    if (!valeurs) return null;
    return {
      vars: valeurs,
      mode: this.mode(),
      animations: this.animationsPermises(),
      params: this.parametres(),
    };
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

  /** Règle un paramètre propre : la valeur est résolue sur sa définition (bornes, liste, type). */
  reglerParametre(nom: string, valeur: ValeurParametre): void {
    const resolues = resoudreParametres(this.definitionsParametres(), {
      ...this.parametres(),
      [nom]: valeur,
    });
    this.parametres.set(resolues);
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
