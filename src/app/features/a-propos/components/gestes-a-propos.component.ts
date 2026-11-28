import { Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { PressePapiersService } from '@core/presse-papiers/presse-papiers.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';
import { PieceVitrineComponent } from '@shared/components/piece-vitrine/piece-vitrine.component';
import { ValeursContrat } from '@shared/livraison/livraison';
import { FicheRessource, cheminZip } from '@shared/models/fiche.model';
import { PIECES_HABIT } from '../a-propos.donnees';

const DELAI_COPIE_MS = 1800;
function iconeDuFichier(nom: string): NomIcone {
  return /\.md$|^LICENSE$/.test(nom) ? 'book-open' : 'code';
}

const NOMS_ANNEXES = ['tokens.css', 'ngshelf-theme.css', 'README.md', 'LICENSE'] as const;

/**
 * « Copier, Régler, Livrer » : le moment fort épinglé (≥ 1024 px, 220 % de défilement). La scène passe du vrai
 * code aux pièces qui changent de design en direct (réglages poussés aux aperçus), puis au vrai zip. La page
 * épingle et pilote `designIndex` ; sans animation, les trois étapes sont empilées et le design reste Planche.
 */
@Component({
  selector: 'app-gestes-a-propos',
  imports: [IconeComponent, PieceVitrineComponent],
  templateUrl: './gestes-a-propos.component.html',
})
export class GestesAProposComponent {
  readonly fiche = input.required<FicheRessource | null>();
  /** Valeurs du design courant, calculées par la page (design, mode du site). */
  readonly reglages = input<ValeursContrat>();
  readonly nomDesign = input.required<string>();

  protected readonly t = TEXTES_APROPOS;
  protected readonly textesFiche = TEXTES_FICHE;
  protected readonly pieces = PIECES_HABIT;
  readonly #presse = inject(PressePapiersService);
  private readonly code = viewChild<ElementRef<HTMLElement>>('code');

  protected readonly copie = signal(false);
  protected readonly copieImpossible = signal(false);
  protected readonly fichier = computed(() => this.fiche()?.fichiers[0] ?? null);
  protected readonly nomZip = computed(() => `${this.fiche()?.meta.slug ?? ''}-tailwind.zip`);
  protected readonly lienZip = computed(() => {
    const slug = this.fiche()?.meta.slug;
    return slug ? cheminZip(slug, 'tailwind') : '';
  });
  protected readonly fichiersZip = computed(() =>
    [...(this.fiche()?.fichiers.map((f) => f.nom) ?? []), ...NOMS_ANNEXES].map((nom) => ({
      nom,
      icone: iconeDuFichier(nom),
    })),
  );

  protected async copier(): Promise<void> {
    const fichier = this.fichier();
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
