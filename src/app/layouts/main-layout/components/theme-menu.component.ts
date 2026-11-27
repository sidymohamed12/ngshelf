import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TEXTES } from '@core/i18n/textes.fr';
import { CHOIX_THEME, ChoixTheme, ThemeService } from '@core/theme/theme.service';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { NomIcone } from '@shared/components/icone/icones';

const ICONE_PAR_CHOIX: Record<ChoixTheme, NomIcone> = {
  clair: 'sun',
  sombre: 'moon',
  systeme: 'desktop',
};

/** Menu du thème (clair, sombre, système) : bouton + menu de trois choix, flèches, Échap, clic extérieur. */
@Component({
  selector: 'app-theme-menu',
  imports: [IconeComponent],
  templateUrl: './theme-menu.component.html',
  host: {
    '(document:click)': 'surClicDocument($event)',
    '(keydown.escape)': 'surEchap()',
  },
})
export class ThemeMenuComponent {
  readonly #theme = inject(ThemeService);
  readonly #injector = inject(Injector);
  readonly #hote = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly textes = TEXTES.theme;
  protected readonly ouvert = signal(false);
  protected readonly choix = this.#theme.choix;
  protected readonly iconeCourante = computed(() => ICONE_PAR_CHOIX[this.choix()]);
  protected readonly libelleBouton = computed(() =>
    this.textes.bouton(this.textes[this.choix()].toLowerCase()),
  );
  protected readonly options = CHOIX_THEME.map((valeur) => ({
    valeur,
    icone: ICONE_PAR_CHOIX[valeur],
    libelle: this.textes[valeur],
  }));

  private readonly declencheur = viewChild.required<ElementRef<HTMLButtonElement>>('declencheur');
  private readonly boutons = viewChildren<ElementRef<HTMLButtonElement>>('optionBtn');

  protected basculer(): void {
    if (this.ouvert()) {
      this.#fermer(false);
    } else {
      this.ouvert.set(true);
      afterNextRender(() => this.#focaliserChoixCourant(), { injector: this.#injector });
    }
  }

  protected choisir(choix: ChoixTheme): void {
    this.#theme.choisir(choix);
    this.#fermer(true);
  }

  protected surTouche(evenement: KeyboardEvent, index: number): void {
    const dernier = this.options.length - 1;
    const cibles: Record<string, number> = {
      ArrowDown: index === dernier ? 0 : index + 1,
      ArrowUp: index === 0 ? dernier : index - 1,
      Home: 0,
      End: dernier,
    };
    if (evenement.key === 'Tab') {
      this.#fermer(false);
      return;
    }
    const cible = cibles[evenement.key];
    if (cible !== undefined) {
      evenement.preventDefault();
      this.boutons()[cible]?.nativeElement.focus();
    }
  }

  protected surEchap(): void {
    if (this.ouvert()) {
      this.#fermer(true);
    }
  }

  protected surClicDocument(evenement: Event): void {
    if (this.ouvert() && !this.#hote.nativeElement.contains(evenement.target as Node)) {
      this.#fermer(false);
    }
  }

  #fermer(rendreLeFocus: boolean): void {
    this.ouvert.set(false);
    if (rendreLeFocus) {
      this.declencheur().nativeElement.focus();
    }
  }

  #focaliserChoixCourant(): void {
    const index = CHOIX_THEME.indexOf(this.choix());
    this.boutons()[index]?.nativeElement.focus();
  }
}
