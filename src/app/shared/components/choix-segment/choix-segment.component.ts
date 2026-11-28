import { Component, ElementRef, inject, input, model } from '@angular/core';

/** Une option du choix : la valeur qu'il émet et le texte du bouton. */
export interface OptionSegment {
  readonly valeur: string;
  readonly libelle: string;
}

const PAS_TOUCHE: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Choix exclusif en segments (`.ngs-seg`, components.css) : un `radiogroup` dont un seul bouton est dans l'ordre
 * de tabulation (tabindex itinérant) ; flèches, Début et Fin déplacent et choisissent, comme un groupe de
 * boutons radio natifs. Nom accessible : `libelle` (texte invisible) ou `libelleId` (étiquette visible).
 */
@Component({
  selector: 'app-choix-segment',
  templateUrl: './choix-segment.component.html',
  host: {
    class: 'ngs-seg',
    role: 'radiogroup',
    '[attr.aria-label]': 'libelle() ?? null',
    '[attr.aria-labelledby]': 'libelleId() ?? null',
  },
})
export class ChoixSegmentComponent {
  readonly options = input.required<readonly OptionSegment[]>();
  readonly valeur = model.required<string>();
  readonly libelle = input<string>();
  readonly libelleId = input<string>();

  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);

  protected choisir(valeur: string): void {
    this.valeur.set(valeur);
  }

  protected surTouche(evenement: KeyboardEvent, index: number): void {
    const n = this.options().length;
    let cible: number;
    if (evenement.key === 'Home') cible = 0;
    else if (evenement.key === 'End') cible = n - 1;
    else if (evenement.key in PAS_TOUCHE)
      cible = (index + (PAS_TOUCHE[evenement.key] ?? 0) + n) % n;
    else return;
    evenement.preventDefault();
    const option = this.options()[cible];
    if (!option) return;
    this.valeur.set(option.valeur);
    this.#hote.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[cible]?.focus();
  }
}
