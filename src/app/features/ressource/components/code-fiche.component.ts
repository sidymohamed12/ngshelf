import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { PressePapiersService } from '@core/presse-papiers/presse-papiers.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { SqueletteComponent } from '@shared/components/squelette/squelette.component';
import { colorer } from '@shared/livraison/colorer';
import { FichierAffiche, FragmentCode } from '@shared/models/fiche.model';
import { EtatFiche } from '../services/etat-fiche';
import { FragmentCodeService } from '../services/fragment-code.service';

const NOM_TOKENS = 'tokens.css';
const NOM_PONT = 'ngshelf-theme.css';
const DELAI_COPIE_MS = 1800;
const DELAI_SURBRILLANCE_MS = 1600;
const FIN_COMMENTAIRE = '*/';

type ChargementCode = 'ok' | 'chargement' | 'erreur';

/** Une ligne du tokens.css affiché, colorée ; `nouvelle` quand le réglage vient de la changer. */
export interface LigneCode {
  readonly html: string;
  readonly nouvelle: boolean;
}

/** Lignes colorées une à une : l'en-tête commentaire est un bloc, ses lignes restent des commentaires. */
export function lignesColorees(code: string, precedentes: readonly string[]): readonly LigneCode[] {
  const lignes = code.split('\n');
  const finEntete = lignes.findIndex((l) => l.includes(FIN_COMMENTAIRE));
  return lignes.map((ligne, i) => ({
    html: i <= finEntete ? `<span class="tok-c">${echapper(ligne)}</span>` : colorer(ligne, 'css'),
    nouvelle: precedentes.length > 0 && precedentes[i] !== ligne,
  }));
}

function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Code de la ressource : version Tailwind ou CSS, un onglet par fichier, copie fichier par fichier. */
@Component({
  selector: 'app-code-fiche',
  imports: [IconeComponent, SqueletteComponent],
  templateUrl: './code-fiche.component.html',
})
export class CodeFicheComponent {
  protected readonly etat = inject(EtatFiche);
  protected readonly textes = TEXTES_FICHE.code;
  protected readonly reessayer = TEXTES_FICHE.reessayer;
  readonly #fragments = inject(FragmentCodeService);
  readonly #presse = inject(PressePapiersService);
  private readonly panneaux = viewChildren<ElementRef<HTMLElement>>('panneau');

  protected readonly fragment = signal<FragmentCode | null>(null);
  protected readonly chargement = signal<ChargementCode>('ok');
  protected readonly actif = signal(0);
  protected readonly copie = signal<string | null>(null);
  protected readonly copieImpossible = signal(false);
  protected readonly tokensModifie = signal(false);
  readonly #tokensPrecedents = signal<readonly string[]>([]);
  readonly #nouvelles = signal(false);

  /** Fichiers de la version choisie, sans les fichiers calculés (tokens.css, pont). */
  readonly #codes = computed<readonly FichierAffiche[]>(() => {
    if (this.etat.variante() === 'tailwind') return this.etat.fiche()?.fichiers ?? [];
    return this.fragment()?.fichiers ?? [];
  });

  /** Fichiers livrés par la version choisie. Aussi la source de « Copier le code » et du zip. */
  readonly fichiers = this.#codes;

  protected readonly noms = computed(() => {
    const noms = this.#codes().map((f) => f.nom);
    noms.push(NOM_TOKENS);
    if (this.etat.variante() === 'tailwind') noms.push(NOM_PONT);
    return noms;
  });

  protected readonly lignesTokens = computed(() =>
    lignesColorees(this.etat.tokensCss(), this.#nouvelles() ? this.#tokensPrecedents() : []),
  );
  protected readonly htmlPont = computed(() => colorer(this.etat.fiche()?.pont ?? '', 'css'));
  protected readonly aide = computed(() =>
    this.etat.variante() === 'tailwind' ? this.textes.aideTailwind : this.textes.aideCss,
  );

  constructor() {
    // La variante se choisit dans l'en-tête de ce bloc : on revient au premier onglet du nouveau code.
    effect(() => {
      this.etat.variante();
      untracked(() => this.actif.set(0));
    });
    // Version CSS : le fragment est chargé au premier besoin, dans le navigateur seulement.
    afterRenderEffect(() => {
      const fiche = this.etat.fiche();
      if (this.etat.variante() === 'css' && fiche && !this.fragment()) {
        void this.charger(fiche.meta.slug);
      }
    });
    // tokens.css : les lignes changées s'allument puis s'éteignent.
    let precedent = '';
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    afterRenderEffect(() => {
      const actuel = this.etat.tokensCss();
      if (precedent !== '' && actuel !== precedent) {
        this.#tokensPrecedents.set(precedent.split('\n'));
        this.#nouvelles.set(true);
        this.tokensModifie.set(true);
        clearTimeout(minuteur);
        minuteur = setTimeout(() => {
          this.#nouvelles.set(false);
          this.tokensModifie.set(false);
        }, DELAI_SURBRILLANCE_MS);
      }
      precedent = actuel;
    });
  }

  protected async charger(slug: string): Promise<void> {
    this.chargement.set('chargement');
    try {
      this.fragment.set(await this.#fragments.charger(slug));
      this.chargement.set('ok');
    } catch {
      this.chargement.set('erreur');
    }
  }

  protected selectionner(i: number): void {
    this.actif.set(Math.min(i, this.noms().length - 1));
  }

  protected surTouche(evenement: KeyboardEvent): void {
    const n = this.noms().length;
    const pas: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (evenement.key === 'Home') this.actif.set(0);
    else if (evenement.key === 'End') this.actif.set(n - 1);
    else if (evenement.key in pas)
      this.actif.set((this.actif() + (pas[evenement.key] ?? 0) + n) % n);
    else return;
    evenement.preventDefault();
  }

  /** Texte brut du fichier d'onglet `i`. */
  protected texte(i: number): string {
    const codes = this.#codes();
    const code = codes[i];
    if (code) return code.code;
    return this.noms()[i] === NOM_TOKENS ? this.etat.tokensCss() : (this.etat.fiche()?.pont ?? '');
  }

  protected async copier(): Promise<void> {
    const i = this.actif();
    const nom = this.noms()[i] ?? '';
    const reussie = await this.#presse.copier(this.texte(i));
    this.copieImpossible.set(!reussie);
    if (!reussie) {
      this.#selectionnerPanneau(i);
      return;
    }
    this.copie.set(nom);
    setTimeout(() => this.copie.set(null), DELAI_COPIE_MS);
  }

  #selectionnerPanneau(i: number): void {
    const panneau = this.panneaux()[i]?.nativeElement;
    const document = panneau?.ownerDocument;
    if (!panneau || !document) return;
    document.defaultView?.getSelection()?.selectAllChildren(panneau);
  }
}
