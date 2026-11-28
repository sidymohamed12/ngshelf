import { Component, computed, inject } from '@angular/core';
import { ApercuService } from './apercu.service';
import { TEXTES_APERCU } from './textes';

/**
 * Barre de la page d'aperçu ouverte seule (nouvel onglet, ADR 0016) : retour à la fiche, design, mode,
 * animations et paramètres propres de la ressource. Invisible dans l'iframe de la fiche ou d'une case.
 * Mêmes tokens que la ressource : la barre suit le design réglé.
 */
@Component({
  selector: 'app-barre-autonome',
  template: `
    <header class="ap-barre">
      <div class="ap-barre__ligne">
        <a class="ap-retour" [href]="retour()" data-sortie>
          <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M224 128a8 8 0 0 1-8 8H59.31l58.35 58.34a8 8 0 0 1-11.32 11.32l-72-72a8 8 0 0 1 0-11.32l72-72a8 8 0 0 1 11.32 11.32L59.31 120H216a8 8 0 0 1 8 8Z"
            />
          </svg>
          <span>{{ retourTexte() }}</span>
        </a>
        <h1 class="ap-titre">{{ titre() }}</h1>
        <div class="ap-reglages" role="group" [attr.aria-label]="textes.reglages">
          @if (contexte.designs.length > 1) {
            <div class="ap-seg" role="radiogroup" [attr.aria-label]="textes.design">
              @for (design of contexte.designs; track design.slug) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="contexte.design() === design.slug"
                  (click)="contexte.choisirDesign(design.slug)"
                >
                  {{ design.nom }}
                </button>
              }
            </div>
          }
          <div class="ap-seg" role="radiogroup" [attr.aria-label]="textes.mode">
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="contexte.mode() === 'clair'"
              (click)="contexte.choisirMode('clair')"
            >
              {{ textes.clair }}
            </button>
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="contexte.mode() === 'sombre'"
              (click)="contexte.choisirMode('sombre')"
            >
              {{ textes.sombre }}
            </button>
          </div>
          <label class="ap-interrupteur" [title]="aideAnimations()">
            <input
              type="checkbox"
              role="switch"
              #animer
              [checked]="contexte.animations()"
              [disabled]="!peutAnimer()"
              (change)="contexte.choisirAnimations(animer.checked)"
            />
            <span class="ap-interrupteur__piste" aria-hidden="true"></span>
            <span>{{ textes.animations }}</span>
          </label>
          <button class="ap-lien" type="button" (click)="contexte.reinitialiser()">
            {{ textes.reinitialiser }}
          </button>
        </div>
      </div>
      @if (contexte.definitions().length > 0) {
        <details class="ap-params">
          <summary>{{ textes.parametres }}</summary>
          <div class="ap-params__corps">
            @for (parametre of contexte.definitions(); track parametre.nom) {
              <div class="ap-param">
                @if (parametre.genre === 'choix') {
                  <span class="ap-param__nom" [id]="'ap-' + parametre.nom">{{
                    parametre.libelle.fr
                  }}</span>
                  <div
                    class="ap-seg"
                    role="radiogroup"
                    [attr.aria-labelledby]="'ap-' + parametre.nom"
                  >
                    @for (option of parametre.options; track option.valeur) {
                      <button
                        type="button"
                        role="radio"
                        [attr.aria-checked]="contexte.parametres()[parametre.nom] === option.valeur"
                        (click)="contexte.reglerParametre(parametre.nom, option.valeur)"
                      >
                        {{ option.libelle.fr }}
                      </button>
                    }
                  </div>
                } @else if (parametre.genre === 'nombre') {
                  <label class="ap-param__nom" [for]="'ap-' + parametre.nom">{{
                    parametre.libelle.fr
                  }}</label>
                  <div class="ap-param__nombre">
                    <input
                      type="range"
                      #curseur
                      [id]="'ap-' + parametre.nom"
                      [min]="parametre.min"
                      [max]="parametre.max"
                      [step]="parametre.pas"
                      [value]="contexte.parametres()[parametre.nom]"
                      (input)="contexte.reglerParametre(parametre.nom, curseur.valueAsNumber)"
                    />
                    <output [for]="'ap-' + parametre.nom"
                      >{{ contexte.parametres()[parametre.nom] }}
                      {{ parametre.unite ?? '' }}</output
                    >
                  </div>
                } @else {
                  <label class="ap-interrupteur">
                    <input
                      type="checkbox"
                      role="switch"
                      #case
                      [checked]="contexte.parametres()[parametre.nom] === true"
                      (change)="contexte.reglerParametre(parametre.nom, case.checked)"
                    />
                    <span class="ap-interrupteur__piste" aria-hidden="true"></span>
                    <span>{{ parametre.libelle.fr }}</span>
                  </label>
                }
              </div>
            }
          </div>
        </details>
      }
    </header>
  `,
})
export class BarreAutonome {
  protected readonly contexte = inject(ApercuService);
  protected readonly textes = TEXTES_APERCU;

  protected readonly titre = computed(
    () => this.contexte.info()?.titre ?? TEXTES_APERCU.titreParDefaut,
  );
  protected readonly retour = computed(() => this.contexte.info()?.fiche ?? '/catalogue');
  protected readonly retourTexte = computed(() =>
    this.contexte.info() ? TEXTES_APERCU.retour : TEXTES_APERCU.retourCatalogue,
  );
  protected readonly peutAnimer = computed(
    () => !this.contexte.mouvementReduit() && (this.contexte.info()?.animee ?? false),
  );
  protected readonly aideAnimations = computed(() => {
    if (this.contexte.mouvementReduit()) return TEXTES_APERCU.animationsReduit;
    return this.contexte.info()?.animee ? '' : TEXTES_APERCU.animationsAucune;
  });
}
