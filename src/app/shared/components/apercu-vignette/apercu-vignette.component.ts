import {
  DOCUMENT,
  DestroyRef,
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { VignettesService } from '@core/apercu/vignettes.service';
import { TEXTES } from '@core/i18n/textes.fr';
import { MotionService } from '@core/motion/motion.service';
import { ThemeService } from '@core/theme/theme.service';
import { lireMessageVersSite, vientDeLApercu } from '@shared/apercu/protocole';
import { ecrireRechercheApercu } from '@shared/apercu/reglages-url';
import { IconeComponent } from '../icone/icone.component';
import { NomIcone } from '../icone/icones';

export type EtatVignette = 'veille' | 'chargement' | 'pret' | 'erreur';

/** Largeur à laquelle l'aperçu est rendu avant d'être réduit pour tenir dans la case. */
export const LARGEUR_NOMINALE_PX = 520;
/** Attente après l'entrée dans le viewport : une case survolée en plein défilement ne charge rien. */
export const DELAI_DEMARRAGE_MS = 300;
/** Sans `ngs-pret` après ce délai, la vignette abandonne et garde son icône. */
export const DELAI_VIGNETTE_MS = 10_000;
const MARGE_VIEWPORT = '120px 0px';

/** Adresse de l'aperçu d'une case : mode clair ou sombre du site, animations coupées si le système le demande. */
export function urlVignette(options: {
  readonly slug: string;
  readonly design?: string;
  readonly mode: 'clair' | 'sombre';
  readonly animations: boolean;
}): string {
  const recherche = new URLSearchParams();
  ecrireRechercheApercu(
    {
      design: options.design,
      mode: options.mode,
      animations: options.animations,
      reglages: {},
      vignette: true,
    },
    recherche,
  );
  return `/apercu/${options.slug}?${recherche.toString()}`;
}

/** Dimensions de l'iframe et échelle d'affichage : l'aperçu garde sa largeur de test et rétrécit pour tenir. */
export function dimensionsVignette(
  largeur: number,
  hauteur: number,
): { readonly largeur: number; readonly hauteur: number; readonly echelle: number } {
  if (largeur <= 0 || hauteur <= 0) return { largeur: 0, hauteur: 0, echelle: 1 };
  const largeurIframe = Math.max(largeur, LARGEUR_NOMINALE_PX);
  const echelle = largeur / largeurIframe;
  return { largeur: largeurIframe, hauteur: hauteur / echelle, echelle };
}

interface NavigatorAvecConnexion extends Navigator {
  readonly connection?: { readonly saveData?: boolean };
}

let compteur = 0;

/**
 * Aperçu vivant d'une case de la planche (ADR 0015) : une iframe `sandbox="allow-scripts"` vers
 * `/apercu/<slug>?vignette=1`, comme celle de la fiche, calée sur la case. Elle n'existe que quand la case
 * est visible (300 ms, jamais pendant un défilement rapide), dans la limite de places de `VignettesService`,
 * et disparaît quand la case sort du viewport. Sans place, avec « économie de données » ou après un échec,
 * la case garde son icône. Décorative : la case entière est le lien vers la fiche.
 */
@Component({
  selector: 'app-apercu-vignette',
  imports: [IconeComponent],
  templateUrl: './apercu-vignette.component.html',
  host: { class: 'ngs-vignette', '[attr.data-etat]': 'etat()' },
})
export class ApercuVignetteComponent {
  readonly slug = input.required<string>();
  readonly titre = input.required<string>();
  readonly icone = input.required<NomIcone>();
  /** Design mis en avant par la ressource ; absent = Planche. */
  readonly design = input<string>();

  protected readonly etat = signal<EtatVignette>('veille');
  protected readonly textes = TEXTES.vignette;
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  readonly #vignettes = inject(VignettesService);
  readonly #mode = inject(ThemeService).mode;
  readonly #mouvementReduit = inject(MotionService).mouvementReduit;
  readonly #destroyRef = inject(DestroyRef);
  readonly #id = `vignette-${compteur++}`;
  private readonly iframe = viewChild<ElementRef<HTMLIFrameElement>>('cadre');

  readonly #visible = signal(false);
  readonly #economie = signal(false);
  readonly #disponible = signal({ largeur: 0, hauteur: 0 });
  /** Place accordée et délai de démarrage écoulé : l'iframe peut exister. */
  protected readonly actif = signal(false);
  #minuteurDemarrage: ReturnType<typeof setTimeout> | undefined;
  #minuteurEchec: ReturnType<typeof setTimeout> | undefined;
  #urlChargee = '';

  protected readonly dimensions = computed(() =>
    dimensionsVignette(this.#disponible().largeur, this.#disponible().hauteur),
  );
  protected readonly url = computed(() =>
    urlVignette({
      slug: this.slug(),
      design: this.design(),
      mode: this.#mode(),
      animations: !this.#mouvementReduit(),
    }),
  );
  protected readonly titreIframe = computed(() => this.textes.iframe(this.titre()));

  constructor() {
    afterNextRender(() => {
      const fenetre = this.#document.defaultView;
      this.#economie.set(
        (fenetre?.navigator as NavigatorAvecConnexion | undefined)?.connection?.saveData === true,
      );
      this.#observerVisibilite();
      this.#observerTaille();
      this.#ecouter();
    });
    // Visibilité, économie de données et places libérées : décident de l'existence de l'iframe.
    effect(() => {
      this.#vignettes.liberations();
      const voulue = this.#visible() && !this.#economie();
      untracked(() => this.#arbitrer(voulue));
    });
    // L'adresse change (mode du site) : l'iframe se recharge.
    afterRenderEffect(() => this.#charger());
    this.#destroyRef.onDestroy(() => this.#liberer());
  }

  #arbitrer(voulue: boolean): void {
    if (!voulue) {
      this.#liberer();
      return;
    }
    if (this.actif() || this.#minuteurDemarrage !== undefined) return;
    this.#minuteurDemarrage = setTimeout(() => {
      this.#minuteurDemarrage = undefined;
      if (this.#visible() && this.#vignettes.reserver(this.#id)) this.actif.set(true);
    }, DELAI_DEMARRAGE_MS);
  }

  #liberer(): void {
    clearTimeout(this.#minuteurDemarrage);
    clearTimeout(this.#minuteurEchec);
    this.#minuteurDemarrage = undefined;
    this.#urlChargee = '';
    this.actif.set(false);
    this.etat.set('veille');
    this.#vignettes.liberer(this.#id);
  }

  #charger(): void {
    const iframe = this.iframe()?.nativeElement;
    const url = this.url();
    if (!iframe || !this.actif() || url === this.#urlChargee) return;
    this.#urlChargee = url;
    this.etat.set('chargement');
    clearTimeout(this.#minuteurEchec);
    this.#minuteurEchec = setTimeout(() => this.#echouer(), DELAI_VIGNETTE_MS);
    // Affecter src impérativement : un [src] lié à une iframe est refusé par l'assainisseur d'Angular.
    iframe.src = url;
  }

  #echouer(): void {
    if (this.etat() !== 'chargement') return;
    this.#liberer();
    this.etat.set('erreur');
  }

  #observerVisibilite(): void {
    const Observateur = this.#document.defaultView?.IntersectionObserver;
    if (!Observateur) {
      this.#visible.set(true);
      return;
    }
    const observateur = new Observateur(
      ([entree]) => this.#visible.set(entree?.isIntersecting ?? false),
      { rootMargin: MARGE_VIEWPORT },
    );
    observateur.observe(this.#hote.nativeElement);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }

  #observerTaille(): void {
    const Observateur = this.#document.defaultView?.ResizeObserver;
    if (!Observateur) return;
    const hote = this.#hote.nativeElement;
    const observateur = new Observateur(() =>
      this.#disponible.set({ largeur: hote.clientWidth, hauteur: hote.clientHeight }),
    );
    observateur.observe(hote);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }

  #ecouter(): void {
    const fenetre = this.#document.defaultView;
    if (!fenetre) return;
    const surMessage = (evenement: MessageEvent<unknown>): void => {
      const cible = this.iframe()?.nativeElement.contentWindow;
      if (!vientDeLApercu(evenement, cible)) return;
      if (lireMessageVersSite(evenement.data)?.type !== 'ngs-pret') return;
      clearTimeout(this.#minuteurEchec);
      this.etat.set('pret');
    };
    fenetre.addEventListener('message', surMessage);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('message', surMessage));
  }
}
