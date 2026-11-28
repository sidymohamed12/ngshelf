import { Component, computed, inject, input, output } from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { Motion } from '@shared/models/motion.model';
import { EtatFiche, LargeurApercu } from '../services/etat-fiche';

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
 * Barre au-dessus de l'aperçu (ADR 0019, ADR 0020) : ce qui concerne le cadre d'affichage seulement,
 * taille et mode, puis rejouer l'entrée ou la sortie et « Agrandir l'aperçu » (fenêtre modale, ADR 0022). Les réglages de la
 * ressource (design, animations, tokens) sont dans le panneau de droite, une seule fois.
 */
@Component({
  selector: 'app-barre-apercu',
  imports: [IconeComponent],
  templateUrl: './barre-apercu.component.html',
})
export class BarreApercuComponent {
  readonly motion = input.required<Motion | null>();
  readonly agrandir = output<void>();
  readonly rejouerEntree = output<void>();
  readonly rejouerSortie = output<void>();

  protected readonly etat = inject(EtatFiche);
  protected readonly textes = TEXTES_FICHE;
  protected readonly tailles = TAILLES;
  protected readonly animationsCoupees = computed(() => !this.etat.animationsPermises());

  protected largeurAriaLabel(valeur: LargeurApercu): string {
    const t = TEXTES_FICHE.apercu;
    if (valeur === 390) return t.tailleMobile;
    if (valeur === 768) return t.tailleTablette;
    return valeur === 1280 ? t.tailleBureau : t.tailleAuto;
  }
}
