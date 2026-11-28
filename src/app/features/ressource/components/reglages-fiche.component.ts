import { Component, computed, inject } from '@angular/core';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { IconeComponent } from '@shared/components/icone/icone.component';
import { COULEURS_ACTION, EtatFiche, POLICES, PoliceReglee } from '../services/etat-fiche';

const DENSITES = [0.85, 1, 1.2] as const;
const RAYON_MAX_PX = 24;

/**
 * Réglages par tokens (groupes repliables) : design, couleur d'action, rayon, densité, police,
 * animations. Tout passe par l'état de la fiche : l'aperçu et le tokens.css suivent.
 */
@Component({
  selector: 'app-reglages-fiche',
  imports: [IconeComponent],
  templateUrl: './reglages-fiche.component.html',
})
export class ReglagesFicheComponent {
  protected readonly etat = inject(EtatFiche);
  protected readonly textes = TEXTES_FICHE.reglages;
  protected readonly couleurs = COULEURS_ACTION;
  protected readonly rayonMax = RAYON_MAX_PX;
  protected readonly densites = DENSITES;
  protected readonly polices = Object.keys(POLICES) as PoliceReglee[];

  protected readonly motion = computed(() => this.etat.fiche()?.meta.motion ?? null);
  protected readonly definitions = this.etat.definitionsParametres;
  protected readonly designs = computed(() => this.etat.fiche()?.designs ?? []);
  protected readonly valeurs = computed(() => this.etat.valeurs());
  protected readonly rayonCourant = computed(() =>
    Number.parseInt(this.valeurs()?.['--ngs-radius'] ?? '0', 10),
  );
  protected readonly densiteCourante = computed(() =>
    Number(this.valeurs()?.['--ngs-density'] ?? 1),
  );
  protected readonly policeCourante = computed<PoliceReglee>(() => {
    const police = this.valeurs()?.['--ngs-font-family'];
    return this.polices.find((p) => POLICES[p] === police) ?? 'systeme';
  });
  protected readonly actionCourante = computed(() => this.valeurs()?.['--ngs-color-action'] ?? '');
  protected readonly couleurChoisie = computed(() => this.etat.reglages().couleur);
  protected readonly rapport = computed(() =>
    this.etat.contraste().rapport.toFixed(1).replace('.', ','),
  );
  protected readonly nomDesign = computed(() => this.etat.designActif()?.nom ?? '');

  protected readonly libellesDensite: Readonly<Record<string, string>> = {
    '0.85': this.textes.serree,
    '1': this.textes.normale,
    '1.2': this.textes.aeree,
  };
  protected readonly libellesPolice: Readonly<Record<PoliceReglee, string>> = {
    systeme: this.textes.systeme,
    arrondie: this.textes.arrondie,
    serif: this.textes.serif,
  };
  protected readonly libellesCouleur = this.textes.couleurs;

  protected libelleAnimations(): string {
    if (!this.motion()) return this.textes.animationsAucune;
    return this.etat.animations() ? this.textes.animationsOn : this.textes.animationsOff;
  }

  protected surNombre(nom: string, valeur: string): void {
    this.etat.reglerParametre(nom, Number(valeur));
  }

  protected surRayon(valeur: string): void {
    this.etat.regler({ rayon: Number(valeur) });
  }

  protected surCouleurLibre(valeur: string): void {
    this.etat.regler({ couleur: valeur });
  }

  protected surAnimations(actives: boolean): void {
    this.etat.animations.set(actives);
  }
}
