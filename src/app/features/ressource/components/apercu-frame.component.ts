import {
  DOCUMENT,
  DestroyRef,
  afterNextRender,
  afterRenderEffect,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { IconeComponent } from '@shared/components/icone/icone.component';
import {
  MessageReglages,
  lireMessageVersSite,
  messageReglages,
  messageSortie,
  vientDeLApercu,
} from '@shared/apercu/protocole';

export type EtatApercu = 'chargement' | 'pret' | 'erreur';
export type LargeurCadre = 'auto' | number;

/** Délai sans « ngs-pret » au bout duquel l'aperçu est déclaré muet (le code reste copiable). */
export const DELAI_APERCU_MS = 10_000;
/** Attente après la sortie avant de recharger l'aperçu, qui rejoue l'entrée. */
const DELAI_REJOUER_ENTREE_MS = 450;
const MARGE_CADRE_PX = 24;
const HAUTEUR_MIN_REM = 28;
const HAUTEUR_MAX_REM = 44;
const PX_PAR_REM = 16;

export function urlApercu(slug: string): string {
  return `/apercu/${slug}`;
}

/** Échelle d'affichage : l'aperçu garde sa largeur de test et rétrécit pour tenir dans le cadre. */
export function echelleApercu(disponible: number, largeur: LargeurCadre): number {
  if (largeur === 'auto' || largeur <= 0 || disponible <= 0) return 1;
  return Math.min(1, disponible / largeur);
}

/**
 * Cadre de l'aperçu live (ADR 0003 et 0010) : iframe `sandbox="allow-scripts"` vers /apercu/<slug>, jamais
 * en srcdoc. Dialogue par messages typés ; chaque message reçu est contrôlé (fenêtre ET origine « null »).
 */
@Component({
  selector: 'app-apercu-frame',
  imports: [IconeComponent],
  templateUrl: './apercu-frame.component.html',
})
export class ApercuFrameComponent {
  readonly slug = input.required<string>();
  readonly titre = input.required<string>();
  readonly largeur = input<LargeurCadre>('auto');
  readonly reglages = input<Omit<MessageReglages, 'v' | 'type'> | null>(null);
  /** Chaque nouvelle valeur recharge l'aperçu (rejouer l'entrée, animations changées). */
  readonly rechargement = input(0);
  /** Chaque nouvelle demande joue la sortie (classe posée sur l'hôte de la ressource). */
  readonly sortie = input<{ readonly id: number; readonly classes: string } | null>(null);

  protected readonly textes = TEXTES_FICHE.apercu;
  protected readonly etats = TEXTES;
  protected readonly etat = signal<EtatApercu>('chargement');
  private readonly iframe = viewChild<ElementRef<HTMLIFrameElement>>('cadre');
  private readonly scene = viewChild<ElementRef<HTMLElement>>('scene');
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);

  readonly #disponible = signal({ largeur: 0, hauteur: 0 });
  readonly #hauteurContenu = signal(0);
  #minuteur: ReturnType<typeof setTimeout> | undefined;
  #dernierRechargement = 0;
  #derniereSortie = 0;

  protected readonly echelle = computed(() =>
    echelleApercu(this.#disponible().largeur, this.largeur()),
  );
  protected readonly largeurIframe = computed(() => {
    const l = this.largeur();
    return l === 'auto' ? Math.max(0, this.#disponible().largeur) : l;
  });
  protected readonly hauteurIframe = computed(
    () => Math.max(0, this.#disponible().hauteur) / this.echelle(),
  );
  /** Hauteur de la scène : celle du contenu annoncé par l'aperçu, bornée, jamais sous le minimum. */
  protected readonly hauteurScene = computed(() => {
    const min = HAUTEUR_MIN_REM * PX_PAR_REM;
    const max = HAUTEUR_MAX_REM * PX_PAR_REM;
    const contenu = this.#hauteurContenu() * this.echelle() + 2 * MARGE_CADRE_PX;
    return Math.round(Math.min(max, Math.max(min, contenu)));
  });
  protected readonly urlAffichee = computed(() => urlApercu(this.slug()));

  constructor() {
    afterNextRender(() => {
      this.#ecouter();
      this.#mesurer();
      this.#charger();
    });
    // Réglages : envoyés dès qu'ils changent, une fois l'aperçu prêt.
    afterRenderEffect(() => {
      const reglages = this.reglages();
      if (this.etat() === 'pret' && reglages) this.#envoyerReglages(reglages);
    });
    afterRenderEffect(() => {
      const n = this.rechargement();
      if (n !== this.#dernierRechargement) {
        this.#dernierRechargement = n;
        this.recharger();
      }
    });
    afterRenderEffect(() => {
      const demande = this.sortie();
      if (demande && demande.id !== this.#derniereSortie && this.etat() === 'pret') {
        this.#derniereSortie = demande.id;
        this.#poster(messageSortie(demande.classes));
      }
    });
    this.#destroyRef.onDestroy(() => clearTimeout(this.#minuteur));
  }

  recharger(): void {
    this.#charger();
  }

  #charger(): void {
    const iframe = this.iframe()?.nativeElement;
    if (!iframe) return;
    this.etat.set('chargement');
    clearTimeout(this.#minuteur);
    this.#minuteur = setTimeout(() => {
      if (this.etat() === 'chargement') this.etat.set('erreur');
    }, DELAI_APERCU_MS);
    // Affecter src (même valeur) recharge l'iframe : l'entrée de la ressource se rejoue.
    iframe.src = this.urlAffichee();
  }

  #ecouter(): void {
    const fenetre = this.#document.defaultView;
    if (!fenetre) return;
    const surMessage = (evenement: MessageEvent<unknown>): void => {
      const cible = this.iframe()?.nativeElement.contentWindow;
      if (!vientDeLApercu(evenement, cible)) return;
      const message = lireMessageVersSite(evenement.data);
      if (!message) return;
      if (message.type === 'ngs-pret') this.#surPret();
      if (message.type === 'ngs-hauteur') this.#hauteurContenu.set(message.hauteur);
      if (message.type === 'ngs-sortie-fin') {
        setTimeout(() => this.recharger(), DELAI_REJOUER_ENTREE_MS);
      }
    };
    fenetre.addEventListener('message', surMessage);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('message', surMessage));
  }

  #surPret(): void {
    clearTimeout(this.#minuteur);
    this.etat.set('pret');
    const reglages = this.reglages();
    if (reglages) this.#envoyerReglages(reglages);
  }

  #envoyerReglages(reglages: Omit<MessageReglages, 'v' | 'type'>): void {
    this.#poster(messageReglages(reglages));
  }

  #poster(message: object): void {
    // Origine opaque (sandbox sans allow-same-origin) : '*' est le seul targetOrigin possible, et rien
    // de secret n'est envoyé (ADR 0010).
    this.iframe()?.nativeElement.contentWindow?.postMessage(message, '*');
  }

  #mesurer(): void {
    const scene = this.scene()?.nativeElement;
    const Observateur = this.#document.defaultView?.ResizeObserver;
    if (!scene || !Observateur) return;
    const observateur = new Observateur(() =>
      this.#disponible.set({
        largeur: scene.clientWidth - 2 * MARGE_CADRE_PX,
        hauteur: scene.clientHeight - 2 * MARGE_CADRE_PX,
      }),
    );
    observateur.observe(scene);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }
}
