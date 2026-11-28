import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { ApercuFrameComponent } from './apercu-frame.component';
import { EtatFiche } from '../services/etat-fiche';

/**
 * Aperçu agrandi (ADR 0022) : une fenêtre modale dans la page, jamais une nouvelle page. C'est un <dialog> natif
 * ouvert avec showModal() : le navigateur piège le focus, rend le reste de la page inerte et ferme sur Échap ;
 * le focus revient au bouton qui l'a ouvert. L'aperçu (même iframe sandboxée que la fiche, ADR 0010) reprend
 * les réglages courants : design, mode, animations, paramètres propres et largeur choisie.
 */
@Component({
  selector: 'app-apercu-agrandi',
  imports: [IconeComponent, ApercuFrameComponent],
  templateUrl: './apercu-agrandi.component.html',
  // Clic sur le fond (le <dialog> lui-même, pas son contenu) : fermeture, comme la palette de recherche.
  host: { '(click)': 'surClic($event)' },
})
export class ApercuAgrandiComponent {
  readonly slug = input.required<string>();
  readonly titre = input.required<string>();
  readonly ouvert = model(false);
  /** Émis à la fermeture, quand le focus doit revenir au déclencheur. */
  readonly ferme = output<void>();

  protected readonly etat = inject(EtatFiche);
  protected readonly textes = TEXTES_FICHE.agrandi;
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  protected readonly boutonFermer = viewChild<ElementRef<HTMLButtonElement>>('fermer');

  protected readonly resume = computed(() => {
    const t = TEXTES_FICHE.apercu;
    const reglages = [this.etat.designActif()?.nom ?? this.etat.design()];
    reglages.push(this.etat.mode() === 'sombre' ? t.sombre : t.clair);
    if (!this.etat.animationsPermises()) reglages.push(this.textes.sansAnimation);
    return reglages.join(' · ');
  });

  constructor() {
    afterRenderEffect(() => {
      const voulu = this.ouvert();
      const dialogue = this.dialogue().nativeElement;
      if (voulu && !dialogue.open) {
        dialogue.showModal();
        this.boutonFermer()?.nativeElement.focus();
      } else if (!voulu && dialogue.open) {
        dialogue.close();
      }
    });
  }

  /** Échap, le bouton ou le fond : l'état suit dans tous les cas. */
  protected surFermeture(): void {
    if (this.dialogue().nativeElement.open) return;
    if (this.ouvert()) this.ouvert.set(false);
    this.ferme.emit();
  }

  /** Maj+Tab sur le premier élément : le focus passe à l'aperçu (fin du cycle) au lieu de quitter la page. */
  protected versLaFin(evenement: Event): void {
    const cadre = this.dialogue().nativeElement.querySelector('iframe');
    if (!cadre) return;
    evenement.preventDefault();
    cadre.focus();
  }

  protected surClic(evenement: MouseEvent): void {
    if (evenement.target === this.dialogue().nativeElement) this.ouvert.set(false);
  }
}
