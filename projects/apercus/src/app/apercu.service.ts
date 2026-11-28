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
import type {
  ParametreReglable,
  ValeurParametre,
  ValeursParametres,
} from '@shared/models/parametre.model';
import {
  MessageReglages,
  MessageSortie,
  ModeApercu,
  lireMessageVersApercu,
  messageHauteur,
  messagePret,
  messageSortieFin,
  vientDuSite,
} from '@shared/apercu/protocole';
import { ORIGINES_SITE } from './origines';

const CLASSE_SOMBRE = 'dark';
const CLASSE_AUTONOME = 'ap-autonome';
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
  readonly #parametres = signal<ValeursParametres>({});
  readonly #titre = inject(Title);
  readonly #mouvementReduit = signal(false);
  readonly #slug = signal<string | null>(null);
  readonly #autonome = signal(false);
  readonly #vignette = signal(false);
  readonly #design = signal<string | undefined>(undefined);
  readonly #reglagesVisiteur = signal<ReglagesVisiteur>({});
  readonly #definitionsSignal = signal<readonly ParametreReglable[]>([]);

  /** Animations permises : les scènes la passent à l'input `animations` de leur ressource. */
  readonly animations = this.#animations.asReadonly();
  readonly mode = this.#mode.asReadonly();
  /** Paramètres propres de la ressource montrée (ADR 0014) : défauts, puis URL, puis messages du site. */
  readonly parametres = this.#parametres.asReadonly();

  /** Vrai quand la page est ouverte seule (nouvel onglet), faux dans l'iframe de la fiche ou d'une case. */
  readonly autonome = this.#autonome.asReadonly();
  /** Vrai pour l'aperçu d'une case de la planche : aucune interaction, aucun message de hauteur. */
  readonly vignette = this.#vignette.asReadonly();
  /** Titre et chemin de la fiche de la ressource montrée (null avant la route ou pour un slug inconnu). */
  readonly info = computed(() => INFOS_APERCUS[this.#slug() ?? ''] ?? null);
  readonly definitions = this.#definitionsSignal.asReadonly();
  /** Préférence du système (`prefers-reduced-motion`) : sur la page autonome, elle coupe les animations. */
  readonly mouvementReduit = this.#mouvementReduit.asReadonly();
  readonly designs = DESIGNS_APERCUS;
  /** Slug du design réglé ; Planche tant que ni l'URL ni la page autonome n'en ont choisi un autre. */
  readonly design = computed(() => this.#design() ?? this.designs[0]?.slug ?? '');

  constructor() {
    afterNextRender(() => this.#demarrer());
  }

  /** Appelé par la route de la scène : fixe la liste blanche des paramètres et leurs valeurs de départ. */
  ouvrir(slug: string): void {
    this.#definitions = PARAMETRES_APERCUS[slug] ?? [];
    this.#definitionsSignal.set(this.#definitions);
    this.#parametres.set(parametresParDefaut(this.#definitions));
    this.#slug.set(slug);
    const info = INFOS_APERCUS[slug];
    if (info) this.#titre.setTitle(`Aperçu : ${info.titre} | NgShelf`);
  }

  /** Recharge la page (état d'erreur de la page autonome). */
  recharger(): void {
    this.#document.defaultView?.location.reload();
  }

  choisirDesign(slug: string): void {
    this.#design.set(slug);
    this.#poserVariables();
  }

  choisirMode(mode: ModeApercu): void {
    this.#appliquerMode(mode);
    this.#poserVariables();
  }

  choisirAnimations(permises: boolean): void {
    this.#appliquerAnimations(permises && !this.#mouvementReduit());
  }

  reglerParametre(nom: string, valeur: ValeurParametre): void {
    this.#parametres.set(
      resoudreParametres(this.#definitions, { ...this.#parametres(), [nom]: valeur }),
    );
  }

  /** « Réinitialiser » de la page autonome : défauts des paramètres, design et mode de départ. */
  reinitialiser(): void {
    this.#parametres.set(parametresParDefaut(this.#definitions));
    this.#reglagesVisiteur.set({});
    this.#design.set(undefined);
    this.#appliquerMode('clair');
    this.#appliquerAnimations(!this.#mouvementReduit());
    this.#poserVariables();
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
    const autonome = fenetre.parent === fenetre && !initial.vignette;
    this.#autonome.set(autonome);
    this.#document.documentElement.classList.toggle(CLASSE_AUTONOME, autonome);
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
    const surMessage = (evenement: MessageEvent<unknown>): void => {
      if (!vientDuSite(evenement, fenetre.parent, ORIGINES_SITE)) return;
      const message = lireMessageVersApercu(evenement.data);
      if (message?.type === 'ngs-reglages') this.#appliquerReglages(message);
      if (message?.type === 'ngs-sortie') this.#jouerSortie(message, fenetre);
    };
    fenetre.addEventListener('message', surMessage);
    this.#destroyRef.onDestroy(() => fenetre.removeEventListener('message', surMessage));
    if (!initial.vignette) this.#suivreHauteur(fenetre);
    this.#envoyer(fenetre, messagePret());
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
   * Pose les 12 variables du design réglé (page autonome ou URL d'une fiche) : même calcul que la fiche
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
