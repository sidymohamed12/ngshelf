import {
  DOCUMENT,
  DestroyRef,
  Service,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DESIGNS_APERCUS, INFOS_APERCUS, PARAMETRES_APERCUS } from '@generated-apercus/scenes';
import { TOKENS_CONTRAT, valeursDuDesign } from '@shared/livraison/livraison';
import { ReglagesVisiteur, lireRechercheApercu, versSurcharges } from '@shared/apercu/reglages-url';
import {
  parametresDepuisRecherche,
  parametresParDefaut,
  resoudreParametres,
} from '@shared/apercu/parametres';
import type { ParametreReglable, ValeursParametres } from '@shared/models/parametre.model';
import {
  MessageReglages,
  MessageSortie,
  ModeApercu,
  lireMessageVersApercu,
  messageHauteur,
  messageManipulation,
  messagePret,
  messageSortieFin,
  vientDuSite,
} from '@shared/apercu/protocole';
import { suivreManipulation } from './manipulation';
import { ORIGINES_SITE } from './origines';

const CLASSE_SOMBRE = 'dark';
const CLASSE_VIGNETTE = 'ap-vignette';
const CLASSE_SANS_ANIMATION = 'ngs-sans-animation';
const SELECTEUR_HOTES = '[data-hote]';
/** Délai après lequel une sortie sans animation en cours est considérée comme terminée. */
const DELAI_DETECTION_SORTIE_MS = 80;
/** Garde-fou : la sortie est terminée au plus tard après ce délai. */
const DELAI_MAX_SORTIE_MS = 1200;
/** Marge verticale du corps de l'aperçu (styles.css : padding de 32 px). */
const MARGE_VERTICALE_PX = 32;

/**
 * Côté aperçu du protocole (ADR 0010) : reçoit les réglages du site, annonce qu'il est prêt, rejoue une
 * sortie à la demande, signale sa hauteur. Navigateur seulement : tout démarre après le premier rendu.
 */
@Service()
export class ApercuService {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #animations = signal(true);
  readonly #mode = signal<ModeApercu>('clair');
  #definitions: readonly ParametreReglable[] = [];
  /** Vrai une fois l'URL lue (après le premier rendu) : une route qui s'ouvre ensuite relit l'URL elle-même. */
  #demarre = false;
  readonly #parametres = signal<ValeursParametres>({});
  readonly #titre = inject(Title);
  readonly #mouvementReduit = signal(false);
  readonly #slug = signal<string | null>(null);
  readonly #vignette = signal(false);
  readonly #manipulation = signal(false);
  readonly #design = signal<string | undefined>(undefined);
  readonly #reglagesVisiteur = signal<ReglagesVisiteur>({});

  /** Animations permises : les scènes la passent à l'input `animations` de leur ressource. */
  readonly animations = this.#animations.asReadonly();
  readonly mode = this.#mode.asReadonly();
  /** Paramètres propres de la ressource montrée (ADR 0014) : défauts, puis URL, puis messages du site. */
  readonly parametres = this.#parametres.asReadonly();

  /** Vrai pour l'aperçu d'une case de la planche : calé sur la case, sans barre ni message de hauteur (ADR 0017). */
  readonly vignette = this.#vignette.asReadonly();
  /**
   * Vrai quand le visiteur a pris la main sur l'aperçu d'une case (clic, ou bouton « Manipuler » du site) :
   * la molette et le clavier agissent alors sur la ressource. Les ressources pilotées par le défilement
   * (hero extensible, iris) passent de leur boucle automatique au vrai défilement.
   */
  readonly manipulation = this.#manipulation.asReadonly();
  /** Préférence du système (`prefers-reduced-motion`) : elle coupe les animations. */
  readonly mouvementReduit = this.#mouvementReduit.asReadonly();
  readonly designs = DESIGNS_APERCUS;
  /** Slug du design réglé ; Planche tant que l'URL n'en a pas choisi un autre. */
  readonly design = computed(() => this.#design() ?? this.designs[0]?.slug ?? '');

  constructor() {
    afterNextRender(() => this.#demarrer());
  }

  /** Appelé par la route de la scène : fixe la liste blanche des paramètres et leurs valeurs de départ. */
  ouvrir(slug: string): void {
    this.#definitions = PARAMETRES_APERCUS[slug] ?? [];
    this.#parametres.set(
      this.#demarre
        ? parametresDepuisRecherche(
            this.#definitions,
            this.#document.defaultView?.location.search ?? '',
          )
        : parametresParDefaut(this.#definitions),
    );
    this.#slug.set(slug);
    const info = INFOS_APERCUS[slug];
    if (info) this.#titre.setTitle(`Aperçu : ${info.titre} | NgShelf`);
  }

  /** Recharge la page (état d'erreur de l'aperçu). */
  recharger(): void {
    this.#document.defaultView?.location.reload();
  }

  /** Un choix parmi `valides` : la scène re-vérifie, le type du résultat est donc sûr sans conversion. */
  choix<T extends string>(nom: string, valides: readonly T[], repli: T): T {
    const valeur = this.#parametres()[nom];
    return valides.find((v) => v === valeur) ?? repli;
  }

  nombre(nom: string, repli: number): number {
    const valeur = this.#parametres()[nom];
    return typeof valeur === 'number' ? valeur : repli;
  }

  booleen(nom: string, repli: boolean): boolean {
    const valeur = this.#parametres()[nom];
    return typeof valeur === 'boolean' ? valeur : repli;
  }

  #demarrer(): void {
    const fenetre = this.#document.defaultView;
    if (!fenetre) return;
    const initial = lireRechercheApercu(fenetre.location.search);
    this.#vignette.set(initial.vignette);
    this.#document.documentElement.classList.toggle(CLASSE_VIGNETTE, initial.vignette);
    const reduit = fenetre.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.#mouvementReduit.set(reduit);
    this.#appliquerMode(initial.mode);
    this.#appliquerAnimations(initial.animations && !reduit);
    this.#reglagesVisiteur.set(initial.reglages);
    if (initial.design !== undefined && this.designs.some((d) => d.slug === initial.design)) {
      this.#design.set(initial.design);
    }
    if (this.#design() !== undefined || Object.keys(initial.reglages).length > 0) {
      this.#poserVariables();
    }
    this.#parametres.set(parametresDepuisRecherche(this.#definitions, fenetre.location.search));
    this.#demarre = true;
    const surMessage = (evenement: MessageEvent<unknown>): void => {
      if (!vientDuSite(evenement, fenetre.parent, ORIGINES_SITE)) return;
      const message = lireMessageVersApercu(evenement.data);
      if (message?.type === 'ngs-reglages') this.#appliquerReglages(message);
      if (message?.type === 'ngs-sortie') this.#jouerSortie(message, fenetre);
    };
    fenetre.addEventListener('message', surMessage);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('message', surMessage));
    if (initial.vignette) {
      const arreter = suivreManipulation({
        fenetre,
        annoncer: (message) => this.#envoyer(fenetre, message),
        surChangement: (actif) => this.#manipulation.set(actif),
      });
      this.#destroyRef.onDestroy(arreter);
    } else {
      this.#suivreHauteur(fenetre);
      this.#signalerEchap(fenetre);
    }
    this.#envoyer(fenetre, messagePret());
  }

  /**
   * Échap tapé dans l'aperçu de la fiche : le focus est dans l'iframe, le <dialog> de l'aperçu agrandi ne le
   * reçoit pas. Le site est prévenu (même message que la prise de main des cases) et ferme la fenêtre.
   */
  #signalerEchap(fenetre: Window): void {
    const surTouche = (evenement: KeyboardEvent): void => {
      if (evenement.key === 'Escape' && !evenement.defaultPrevented) {
        this.#envoyer(fenetre, messageManipulation(false, true));
      }
    };
    fenetre.addEventListener('keydown', surTouche);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('keydown', surTouche));
  }

  #envoyer(fenetre: Window, message: object): void {
    // Origine opaque côté site : '*' est le seul targetOrigin possible, rien de secret n'est envoyé (ADR 0010).
    if (fenetre.parent !== fenetre) fenetre.parent.postMessage(message, '*');
  }

  #appliquerReglages(message: MessageReglages): void {
    const racine = this.#document.documentElement;
    for (const [cle, valeur] of Object.entries(message.vars)) racine.style.setProperty(cle, valeur);
    this.#appliquerMode(message.mode);
    this.#appliquerAnimations(message.animations);
    this.#parametres.set(resoudreParametres(this.#definitions, message.params));
  }

  /**
   * Pose les 12 variables du design réglé (URL de l'aperçu) : même calcul que la fiche
   * (`valeursDuDesign`). Les messages du site, eux, posent directement les valeurs qu'il a calculées.
   */
  #poserVariables(): void {
    const racine = this.#document.documentElement;
    const personnalise =
      this.#design() !== undefined || Object.keys(this.#reglagesVisiteur()).length > 0;
    const design = this.designs.find((d) => d.slug === this.design());
    if (!personnalise || !design) {
      // Rien de réglé : le tokens.css livré (Planche, clair et .dark) s'applique seul.
      for (const token of TOKENS_CONTRAT) racine.style.removeProperty(token);
      return;
    }
    const valeurs = valeursDuDesign(design, this.#mode(), versSurcharges(this.#reglagesVisiteur()));
    for (const token of TOKENS_CONTRAT) racine.style.setProperty(token, valeurs[token]);
  }

  #appliquerMode(mode: ModeApercu): void {
    this.#mode.set(mode);
    this.#document.documentElement.classList.toggle(CLASSE_SOMBRE, mode === 'sombre');
  }

  #appliquerAnimations(permises: boolean): void {
    this.#animations.set(permises);
    this.#document.documentElement.classList.toggle(CLASSE_SANS_ANIMATION, !permises);
  }

  /** « Rejouer la sortie » : la classe est posée sur l'hôte, comme le ferait animate.leave. */
  #jouerSortie(message: MessageSortie, fenetre: Window): void {
    const hotes = [...this.#document.querySelectorAll<HTMLElement>(SELECTEUR_HOTES)];
    let termine = false;
    const finir = (): void => {
      if (termine) return;
      termine = true;
      this.#envoyer(fenetre, messageSortieFin());
    };
    for (const hote of hotes) {
      hote.classList.add(...message.classes.split(' '));
      hote.addEventListener('animationend', finir, { once: true });
    }
    fenetre.setTimeout(() => {
      const nom = hotes[0] ? fenetre.getComputedStyle(hotes[0]).animationName : 'none';
      if (!nom || nom === 'none') finir();
    }, DELAI_DETECTION_SORTIE_MS);
    fenetre.setTimeout(finir, DELAI_MAX_SORTIE_MS);
  }

  #suivreHauteur(fenetre: Window): void {
    // On mesure le contenu (la scène), pas le corps : celui-ci a min-height 100vh et ne rétrécirait jamais.
    const corps = this.#document.body;
    const scene = this.#document.querySelector('main') ?? corps;
    let derniere = -1;
    const annoncer = (): void => {
      const hauteur = Math.ceil(scene.getBoundingClientRect().height + 2 * MARGE_VERTICALE_PX);
      if (hauteur === derniere) return;
      derniere = hauteur;
      this.#envoyer(fenetre, messageHauteur(hauteur));
    };
    const observateur = new ResizeObserver(annoncer);
    observateur.observe(scene);
    this.#destroyRef.onDestroy(() => observateur.disconnect());
  }
}
