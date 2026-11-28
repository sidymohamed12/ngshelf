import { Component, computed, input, output } from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { FicheRessource } from '@shared/models/fiche.model';
import { Moment } from '@shared/models/motion.model';
import { classeCategorie } from '@shared/utils/taxonomie-affichage';
import { EtatTelechargement } from '../services/livraison-fiche.service';

/**
 * Bandeau d'identité de la fiche (ADR 0020), un seul bloc linéaire : badges et titre à gauche, copie et
 * téléchargement à droite sur la ligne du titre, description, puis la fiche technique en une rangée.
 */
@Component({
  selector: 'app-fiche-identite',
  imports: [IconeComponent],
  templateUrl: './fiche-identite.component.html',
})
export class FicheIdentiteComponent {
  readonly fiche = input.required<FicheRessource>();
  /** Libellé de la catégorie, premier badge. */
  readonly categorie = input.required<string>();
  readonly copie = input.required<boolean>();
  readonly telechargement = input.required<EtatTelechargement>();
  readonly copier = output<void>();
  readonly telecharger = output<void>();

  protected readonly textes = TEXTES_FICHE;
  protected readonly motion = computed(() => this.fiche().meta.motion);
  protected readonly classeCategorie = computed(() => classeCategorie(this.fiche().meta.categorie));
  protected readonly momentsTexte = computed(() => {
    const m = this.motion();
    if (!m) return TEXTES_FICHE.meta.sansAnimation;
    const libelles = m.moments.map((moment: Moment) => TEXTES_FICHE.moments[moment]);
    return TEXTES_FICHE.meta.animationsValeur(libelles.join(', '));
  });
  protected readonly libelleTelecharger = computed(() => {
    const t = this.telechargement();
    if (t === 'encours') return TEXTES_FICHE.telechargeEnCours;
    return t === 'fait' ? TEXTES_FICHE.telecharge : TEXTES_FICHE.telecharger;
  });
}
