import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

interface Jour {
  readonly date: Date;
  readonly numero: number;
}

const PAS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

@Component({
  selector: 'ngs-calendrier',
  templateUrl: './calendrier.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierComponent {
  readonly selection = model<Date | null>(null);
  readonly locale = input('fr-FR');
  /** false : le mois change sans glisser. */
  readonly animations = input(true, { transform: booleanAttribute });

  private readonly injector = inject(Injector);
  private readonly grille = viewChild.required<ElementRef<HTMLElement>>('grille');
  private readonly aujourdhui = debutDuJour(new Date());

  protected readonly vue = signal(premierDuMois(this.aujourdhui));
  protected readonly focus = signal(this.aujourdhui);
  /** Sens du dernier changement de mois : 1 suivant, -1 précédent, 0 au premier affichage. */
  protected readonly sens = signal(0);

  protected readonly libelleMois = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this.vue()),
  );
  private readonly formatJour = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
  );
  /** Cases vides avant le 1er (semaine commençant le lundi). */
  protected readonly decalage = computed(() =>
    Array.from({ length: (this.vue().getDay() + 6) % 7 }),
  );
  protected readonly jours = computed<Jour[]>(() => {
    const v = this.vue();
    const nombre = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
    return Array.from({ length: nombre }, (_, i) => ({
      date: new Date(v.getFullYear(), v.getMonth(), i + 1),
      numero: i + 1,
    }));
  });
  protected readonly libelleChoix = computed(() => {
    const s = this.selection();
    return s ? this.formatJour().format(s) : 'aucune';
  });

  protected libelle(d: Date): string {
    return this.formatJour().format(d);
  }

  protected changerDeMois(pas: number): void {
    const v = this.vue();
    const suivant = new Date(v.getFullYear(), v.getMonth() + pas, 1);
    this.sens.set(pas);
    this.vue.set(suivant);
    this.focus.set(suivant);
  }

  protected choisir(jour: Jour): void {
    this.selection.set(jour.date);
    this.focus.set(jour.date);
  }

  protected clavier(evenement: KeyboardEvent): void {
    const v = this.vue();
    let cible: Date | undefined;
    if (evenement.key in PAS) {
      cible = new Date(this.focus());
      cible.setDate(cible.getDate() + PAS[evenement.key]);
    } else if (evenement.key === 'Home') {
      cible = new Date(v.getFullYear(), v.getMonth(), 1);
    } else if (evenement.key === 'End') {
      cible = new Date(v.getFullYear(), v.getMonth() + 1, 0);
    }
    if (!cible) return;
    evenement.preventDefault();
    this.focus.set(cible);
    const mois = premierDuMois(cible);
    if (mois.getTime() !== v.getTime()) this.sens.set(mois > v ? 1 : -1);
    this.vue.set(mois);
    afterNextRender(
      () => this.grille().nativeElement.querySelector<HTMLElement>('[tabindex="0"]')?.focus(),
      {
        injector: this.injector,
      },
    );
  }

  protected estAujourdhui(d: Date): boolean {
    return d.getTime() === this.aujourdhui.getTime();
  }

  protected estChoisi(d: Date): boolean {
    return d.getTime() === this.selection()?.getTime();
  }

  protected estFocus(d: Date): boolean {
    const f = this.focus();
    return f.getMonth() === this.vue().getMonth()
      ? d.getTime() === debutDuJour(f).getTime()
      : d.getDate() === 1;
  }
}

function debutDuJour(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function premierDuMois(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
