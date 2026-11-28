import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_CATEGORIE, LIBELLES_TYPE, TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { PressePapiersService } from '@core/presse-papiers/presse-papiers.service';
import { cheminCategorie, cheminType } from '@core/registre/chemins';
import { PlancheComponent } from '@shared/components/planche/planche.component';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { Moment } from '@shared/models/motion.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';
import { RegistreService } from '@core/registre/registre.service';
import { parametresVersRecherche } from '@shared/apercu/parametres';
import { ecrireRechercheApercu } from '@shared/apercu/reglages-url';
import { ApercuFrameComponent, urlApercu } from '../components/apercu-frame.component';
import { CodeFicheComponent } from '../components/code-fiche.component';
import { ReglagesFicheComponent } from '../components/reglages-fiche.component';
import { EtatFiche, LargeurApercu } from '../services/etat-fiche';
import { FicheService, ResultatFiche } from '../services/fiche.service';
import {
  ContenuLivre,
  EtatTelechargement,
  LivraisonFicheService,
  toutLeCode,
} from '../services/livraison-fiche.service';

const DELAI_RETOUR_MS = 2200;
const NOMBRE_AUTRES = 3;

const TAILLES: readonly {
  valeur: LargeurApercu;
  icone: 'device-mobile' | 'device-tablet' | 'desktop' | null;
}[] = [
  { valeur: 'auto', icone: null },
  { valeur: 390, icone: 'device-mobile' },
  { valeur: 768, icone: 'device-tablet' },
  { valeur: 1280, icone: 'desktop' },
];

/**
 * Fiche d'une ressource, URL /<categorie>/<type>/<slug> (ADR 0004). Les données arrivent du resolver,
 * avant la navigation (ADR 0011). États : trouvée, introuvable, erreur de chargement (« Réessayer »).
 * L'état des réglages est propre à la page (`EtatFiche`), jamais partagé.
 */
@Component({
  selector: 'app-ressource',
  imports: [
    RouterLink,
    IconeComponent,
    PlancheComponent,
    ApercuFrameComponent,
    ReglagesFicheComponent,
    CodeFicheComponent,
  ],
  providers: [EtatFiche],
  templateUrl: './ressource.component.html',
})
export class RessourceComponent {
  /** Résultat du resolver (`resolve: { donnees }`). */
  readonly donnees = input.required<ResultatFiche>();
  /** Paramètres de la route, pour relancer le chargement. */
  readonly categorie = input<string>();
  readonly type = input<string>();
  readonly slug = input<string>();

  protected readonly etat = inject(EtatFiche);
  protected readonly textes = TEXTES_FICHE;
  protected readonly erreur = TEXTES.etats;
  protected readonly introuvable = TEXTES.pages.ressource;
  protected readonly tailles = TAILLES;
  readonly #fiches = inject(FicheService);
  readonly #registre = inject(RegistreService);
  readonly #livraison = inject(LivraisonFicheService);
  readonly #presse = inject(PressePapiersService);
  private readonly code = viewChild(CodeFicheComponent);

  /** Remplace le résultat du resolver après un « Réessayer ». */
  protected readonly relance = signal<ResultatFiche | null>(null);
  protected readonly resultat = computed(() => this.relance() ?? this.donnees());
  protected readonly fiche = computed(() => {
    const r = this.resultat();
    return r.etat === 'ok' ? r.fiche : null;
  });
  protected readonly rechargement = signal(0);
  protected readonly sortie = signal<{ id: number; classes: string } | null>(null);
  protected readonly telechargement = signal<EtatTelechargement>('repos');
  protected readonly copie = signal(false);
  protected readonly autres = signal<readonly EntreeIndex[]>([]);

  protected readonly meta = computed(() => this.fiche()?.meta ?? null);
  protected readonly motion = computed(() => this.meta()?.motion ?? null);
  protected readonly classeCategorie = computed(() => {
    const m = this.meta();
    return m ? classeCategorie(m.categorie) : '';
  });
  protected readonly chemins = computed(() => {
    const m = this.meta();
    if (!m) return [];
    return [
      { libelle: LIBELLES_CATEGORIE[m.categorie].pluriel, chemin: cheminCategorie(m.categorie) },
      { libelle: LIBELLES_TYPE[m.type], chemin: cheminType(m.categorie, m.type) },
    ];
  });
  protected readonly momentsTexte = computed(() => {
    const m = this.motion();
    if (!m) return TEXTES_FICHE.meta.sansAnimation;
    const libelles = m.moments.map((moment: Moment) => TEXTES_FICHE.moments[moment]);
    return TEXTES_FICHE.meta.animationsValeur(libelles.join(', '));
  });
  /** Adresse de la page d'aperçu autonome, avec le design, le mode et les réglages courants (ADR 0016). */
  protected readonly urlAutonome = computed(() => {
    const slug = this.meta()?.slug;
    if (!slug) return '';
    const recherche = new URLSearchParams();
    ecrireRechercheApercu(
      {
        design: this.etat.design(),
        mode: this.etat.mode(),
        animations: this.etat.animationsPermises(),
        reglages: this.etat.reglages(),
      },
      recherche,
    );
    parametresVersRecherche(this.etat.definitionsParametres(), this.etat.parametres(), recherche);
    const texte = recherche.toString();
    return texte ? `${urlApercu(slug)}?${texte}` : urlApercu(slug);
  });
  protected readonly versionAngular = computed(() => this.meta()?.angularMin.split('.')[0] ?? '');
  protected readonly etapes = computed(() => {
    const slug = this.meta()?.slug ?? '';
    const t = TEXTES_FICHE.installation;
    return [t.copie(slug), this.etat.variante() === 'tailwind' ? t.tailwind : t.css, t.imports];
  });
  protected readonly usage = computed(() => {
    const code = this.fiche()?.usage ?? '';
    if (!this.motion() || this.etat.animations()) return code;
    return code.replace(/<(ngs-[\w-]+)([\s\S]*?)(\s*)\/>/, '<$1$2 [animations]="false" />');
  });
  protected readonly libelleTelecharger = computed(() => {
    const t = this.telechargement();
    if (t === 'encours') return TEXTES_FICHE.telechargeEnCours;
    return t === 'fait' ? TEXTES_FICHE.telecharge : TEXTES_FICHE.telecharger;
  });

  constructor() {
    effect(() => {
      const fiche = this.fiche();
      if (fiche) untracked(() => this.etat.ouvrir(fiche));
    });
    effect(() => {
      const m = this.meta();
      if (m) void this.#chargerAutres(m.slug, m.type, m.categorie);
    });
  }

  async #chargerAutres(
    slug: string,
    type: string,
    categorie: EntreeIndex['categorie'],
  ): Promise<void> {
    try {
      const index = await this.#registre.indexDe(categorie);
      const memeType = index.filter((e) => e.slug !== slug && e.type === type);
      const reste = index.filter((e) => e.slug !== slug && e.type !== type);
      this.autres.set([...memeType, ...reste].slice(0, NOMBRE_AUTRES));
    } catch {
      this.autres.set([]);
    }
  }

  protected async reessayer(): Promise<void> {
    this.relance.set(
      await this.#fiches.charger({
        categorie: this.categorie(),
        type: this.type(),
        slug: this.slug(),
      }),
    );
  }

  protected largeurAriaLabel(valeur: LargeurApercu): string {
    const t = TEXTES_FICHE.apercu;
    if (valeur === 390) return t.tailleMobile;
    if (valeur === 768) return t.tailleTablette;
    return valeur === 1280 ? t.tailleBureau : t.tailleAuto;
  }

  protected rejouerEntree(): void {
    this.rechargement.update((n) => n + 1);
  }

  protected rejouerSortie(): void {
    const classes = this.motion()?.rejouer?.sortie;
    if (classes) this.sortie.set({ id: (this.sortie()?.id ?? 0) + 1, classes });
  }

  protected surAnimations(): void {
    // Le réglage change : l'aperçu est rechargé, l'entrée se rejoue (ou non) sous le nouveau réglage.
    this.rechargement.update((n) => n + 1);
  }

  /** Interrupteur « Animations » de la barre : même état que celui du panneau de réglages. */
  protected basculerAnimations(actives: boolean): void {
    this.etat.animations.set(actives);
  }

  protected animationsCoupees(): boolean {
    return !this.etat.animationsPermises();
  }

  #contenu(): ContenuLivre | null {
    const fiche = this.fiche();
    const code = this.code();
    if (!fiche || !code) return null;
    return {
      fiche,
      variante: this.etat.variante(),
      fichiers: code.fichiers(),
      tokensCss: this.etat.tokensCss(),
      personnalise: this.etat.aDesReglages(),
    };
  }

  protected async copierTout(): Promise<void> {
    const contenu = this.#contenu();
    if (!contenu) return;
    const reussie = await this.#presse.copier(toutLeCode(contenu));
    if (!reussie) return;
    this.copie.set(true);
    setTimeout(() => this.copie.set(false), DELAI_RETOUR_MS);
  }

  protected async telecharger(): Promise<void> {
    const contenu = this.#contenu();
    if (!contenu) return;
    this.telechargement.set('encours');
    try {
      await this.#livraison.telecharger(contenu);
      this.telechargement.set('fait');
      setTimeout(() => this.telechargement.set('repos'), DELAI_RETOUR_MS);
    } catch {
      this.telechargement.set('erreur');
    }
  }
}
