import {
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { TEXTES_ACCUEIL } from '@core/i18n/textes-accueil';
import { PressePapiersService } from '@core/presse-papiers/presse-papiers.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { FicheRessource, cheminZip } from '@shared/models/fiche.model';

const DELAI_COPIE_MS = 1800;
const NOMS_ANNEXES = ['tokens.css', 'ngshelf-theme.css', 'README.md', 'LICENSE'] as const;

interface FichierZip {
  readonly nom: string;
  readonly icone: NomIcone;
}

function iconeDuFichier(nom: string): NomIcone {
  return /\.md$|^LICENSE$/.test(nom) ? 'book-open' : 'code';
}

/**
 * « Deux gestes, et la pièce est chez vous » : le vrai code de la ressource de démonstration (copie réelle) et
 * le vrai contenu de son zip (téléchargement réel, un simple lien). Une fiche absente (chargement échoué)
 * donne l'état d'erreur avec « Réessayer ». À partir de 1024 px et avec mouvement, la page épingle la
 * démonstration à droite et change de vue avec la rangée active ; sinon les deux vues sont empilées.
 */
@Component({
  selector: 'app-gestes-accueil',
  imports: [IconeComponent],
  templateUrl: './gestes-accueil.component.html',
})
export class GestesAccueilComponent {
  readonly fiche = input.required<FicheRessource | null>();
  readonly reessayer = output();

  protected readonly t = TEXTES_ACCUEIL;
  protected readonly etats = TEXTES.etats;
  protected readonly textesFiche = TEXTES_FICHE;
  readonly #presse = inject(PressePapiersService);
  private readonly code = viewChild<ElementRef<HTMLElement>>('code');

  protected readonly copie = signal(false);
  protected readonly copieImpossible = signal(false);

  /** Premier fichier de la variante Tailwind : le composant lui-même. */
  protected readonly fichierCode = computed(() => this.fiche()?.fichiers[0] ?? null);
  protected readonly nomZip = computed(() => {
    const slug = this.fiche()?.meta.slug;
    return slug ? `${slug}-tailwind.zip` : '';
  });
  protected readonly lienZip = computed(() => {
    const slug = this.fiche()?.meta.slug;
    return slug ? cheminZip(slug, 'tailwind') : '';
  });
  protected readonly fichiersZip = computed<readonly FichierZip[]>(() =>
    [...(this.fiche()?.fichiers.map((f) => f.nom) ?? []), ...NOMS_ANNEXES].map((nom) => ({
      nom,
      icone: iconeDuFichier(nom),
    })),
  );

  protected async copier(): Promise<void> {
    const fichier = this.fichierCode();
    if (!fichier) return;
    const reussie = await this.#presse.copier(fichier.code);
    this.copieImpossible.set(!reussie);
    if (!reussie) {
      const code = this.code()?.nativeElement;
      code?.ownerDocument.defaultView?.getSelection()?.selectAllChildren(code);
      return;
    }
    this.copie.set(true);
    setTimeout(() => this.copie.set(false), DELAI_COPIE_MS);
  }
}
