/*
  Registre de démonstration (PROVISOIRE) — préfigure registry/<famille>/<slug>/ (ADR 0002).
  Une seule source pour : l'aperçu live (Shadow DOM / iframe), le code affiché (CSS ou Tailwind), le zip.

  Chaque ressource :
  - famille / type / secteur : taxonomie (voir NGS.familles, NGS.types, NGS.secteurs plus bas) ;
  - css   : CSS réel du composant, uniquement en var(--ngs-…, repli) (contrat-tokens.css) ;
  - tw    : correspondance classe BEM → utilitaires Tailwind v4 (thème : NGS.contrat.fichierTailwind) ;
            ':host' = classes posées sur l'hôte du composant (host: { class } en Angular) ;
  - demo  : balisage de démonstration (même structure que le template Angular) ;
  - init(root, cls) : comportement de la démo en JS natif ; cls('bem') rend les classes de la variante ;
  - motion : animations propres de la ressource, ou null. { resume, moments: ['entree'|'sortie'|'survol'|'ouverture'|'changement'],
            technique }. Toujours sobres, en CSS (@keyframes, transitions) ou Angular (animate.enter / animate.leave),
            coupées par l'input animations (classe .ngs-sans-animation sur l'hôte), par cette classe sur un parent,
            ou par prefers-reduced-motion. Le badge « Animée » et le filtre du catalogue en dépendent.
  - angular : code Angular 22 (standalone par défaut, signals, input/output/model, @if/@for, OnPush).
            ts contient le marqueur STYLE (commentaire) remplacé par styleUrl (CSS) ou host.class (Tailwind).
  Aucune ressource n'utilise GSAP ni bibliothèque d'icônes (SVG en ligne).
*/
(function () {
  var NGS = (window.NGS = window.NGS || {});
  var BASE = '*, *::before, *::after { box-sizing: border-box; }\n';
  var r = [];

  var SVG = {
    gauche: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>',
    droite: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>',
    alerte: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>',
    coche: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>',
    x: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>',
    caret: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>',
    liste: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>',
    repere: '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/></svg>'
  };
  NGS.svgRessources = SVG;

  var IMG = '../maquette/assets/images/'; /* valable depuis maquette/ et design-system/ */

  /* ------------------------------------------------------------------ */
  /* 1. Interrupteur                                                     */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'interrupteur', famille: 'composants', type: 'interrupteur', secteurs: [],
    titre: 'Interrupteur',
    description: 'Un réglage qui s’active ou se coupe d’un geste, annoncé comme un « switch » aux lecteurs d’écran.',
    tags: ['formulaire', 'réglage', 'switch', 'toggle'],
    css: BASE + `:host {
  display: inline-block;
  font-family: var(--ngs-font-family, system-ui, sans-serif);
  color: var(--ngs-color-text, #0b0b0c);
}
.interrupteur {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--ngs-density, 1) * 12px);
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
}
.interrupteur__piste {
  position: relative;
  flex: none;
  width: calc(var(--ngs-density, 1) * 48px);
  height: calc(var(--ngs-density, 1) * 28px);
  border-radius: calc(var(--ngs-radius, 10px) * 1.4);
  background: var(--ngs-color-surface-alt, #f4f4f5);
  box-shadow: inset 0 0 0 1.5px var(--ngs-color-border, #8a8a93);
  transition: background-color var(--ngs-duration, 160ms) ease-out, box-shadow var(--ngs-duration, 160ms) ease-out;
}
.interrupteur__pouce {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(var(--ngs-density, 1) * 28px - 8px);
  aspect-ratio: 1;
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-border, #8a8a93);
  transition: transform var(--ngs-duration, 160ms) cubic-bezier(.2, .8, .2, 1), background-color var(--ngs-duration, 160ms) ease-out;
}
.interrupteur[aria-checked="true"] .interrupteur__piste {
  background: var(--ngs-color-action, #0b0b0c);
  box-shadow: inset 0 0 0 1.5px var(--ngs-color-action, #0b0b0c);
}
.interrupteur[aria-checked="true"] .interrupteur__pouce {
  transform: translateX(calc(var(--ngs-density, 1) * 20px));
  background: var(--ngs-color-on-action, #ffffff);
}
.interrupteur:focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 4px; border-radius: 4px; }
.interrupteur:disabled { opacity: .5; cursor: not-allowed; }
.interrupteur__texte { display: grid; gap: 2px; }
.interrupteur__label { font-weight: 600; }
.interrupteur__aide { font-size: .875rem; color: var(--ngs-color-text-muted, #5f5f66); }
@media (prefers-reduced-motion: reduce) { .interrupteur__piste, .interrupteur__pouce { transition-duration: 1ms; } }`,
    tw: {
      ':host': 'inline-block font-ngs text-ngs-text',
      interrupteur: 'group inline-flex min-h-11 cursor-pointer items-center gap-ngs-3 border-0 bg-transparent p-0 text-left text-base text-inherit focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ngs-action disabled:cursor-not-allowed disabled:opacity-50',
      interrupteur__piste: 'relative h-ngs-7 w-ngs-12 flex-none rounded-[calc(var(--radius-ngs)*1.4)] bg-ngs-surface-alt shadow-[inset_0_0_0_1.5px_var(--color-ngs-border)] transition-colors duration-(--ngs-duration) group-aria-checked:bg-ngs-action group-aria-checked:shadow-[inset_0_0_0_1.5px_var(--color-ngs-action)] motion-reduce:transition-none',
      interrupteur__pouce: 'absolute top-1 left-1 aspect-square w-[calc(var(--spacing-ngs-7)-8px)] rounded-ngs bg-ngs-border transition duration-(--ngs-duration) group-aria-checked:translate-x-ngs-5 group-aria-checked:bg-ngs-on-action motion-reduce:transition-none',
      interrupteur__texte: 'grid gap-0.5',
      interrupteur__label: 'font-semibold',
      interrupteur__aide: 'text-sm text-ngs-text-muted'
    },
    demo: `<button class="interrupteur" type="button" role="switch" aria-checked="true"><span class="interrupteur__piste" aria-hidden="true"><span class="interrupteur__pouce"></span></span><span class="interrupteur__texte"><span class="interrupteur__label">Notifications par e-mail</span><span class="interrupteur__aide">Un message quand une commande part.</span></span></button>`,
    init: function (root) {
      var b = root.querySelector('.interrupteur');
      b.addEventListener('click', function () { b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')); });
    },
    usage: `<ngs-interrupteur
  label="Notifications par e-mail"
  aide="Un message quand une commande part."
  [(coche)]="notifications"
/>`,
    api: [
      { nom: 'label', type: 'input.required<string>()', defaut: '—', role: 'Texte visible du réglage.' },
      { nom: 'aide', type: 'input<string>()', defaut: "''", role: 'Phrase d’aide sous le label.' },
      { nom: 'desactive', type: 'input<boolean>()', defaut: 'false', role: 'Empêche la bascule.' },
      { nom: 'coche', type: 'model<boolean>()', defaut: 'false', role: 'État, liable en [(coche)].' }
    ],
    angular: {
      nom: 'interrupteur',
      ts: `import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

@Component({
  selector: 'ngs-interrupteur',
  templateUrl: './interrupteur.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterrupteurComponent {
  readonly label = input.required<string>();
  readonly aide = input('');
  readonly desactive = input(false, { transform: booleanAttribute });
  readonly coche = model(false);

  protected basculer(): void {
    this.coche.update((valeur) => !valeur);
  }
}`,
      html: `<button
  class="interrupteur"
  type="button"
  role="switch"
  [attr.aria-checked]="coche()"
  [disabled]="desactive()"
  (click)="basculer()"
>
  <span class="interrupteur__piste" aria-hidden="true">
    <span class="interrupteur__pouce"></span>
  </span>
  <span class="interrupteur__texte">
    <span class="interrupteur__label">{{ label() }}</span>
    @if (aide()) {
      <span class="interrupteur__aide">{{ aide() }}</span>
    }
  </span>
</button>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 2. Calendrier                                                       */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'calendrier', famille: 'composants', type: 'calendrier', secteurs: [],
    titre: 'Calendrier',
    description: 'Choisir une date dans le mois, à la souris ou au clavier (flèches, début, fin), libellés en français.',
    tags: ['date', 'formulaire', 'agenda', 'datepicker', 'réservation'],
    taille: 'ngs-case--wide ngs-case--tall',
    css: BASE + `:host {
  display: block;
  max-width: 100%;
  font-family: var(--ngs-font-family, system-ui, sans-serif);
  color: var(--ngs-color-text, #0b0b0c);
}
.calendrier {
  display: grid;
  gap: calc(var(--ngs-density, 1) * 12px);
  width: max-content;
  max-width: 100%;
  padding: calc(var(--ngs-density, 1) * 16px) clamp(8px, 3vw, calc(var(--ngs-density, 1) * 16px));
  border-radius: calc(var(--ngs-radius, 10px) * 1.6);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93);
}
.calendrier__tete { display: flex; align-items: center; gap: 4px; }
.calendrier__mois { flex: 1; margin: 0; padding-left: 6px; font-size: 1rem; font-weight: 650; }
.calendrier__mois::first-letter { text-transform: uppercase; }
.calendrier__nav {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--ngs-radius, 10px);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color var(--ngs-duration, 160ms) ease-out;
}
.calendrier__nav:hover { background: var(--ngs-color-surface-alt, #f4f4f5); }
.calendrier__nav svg { width: 18px; height: 18px; }
.calendrier__semaine, .calendrier__jours {
  display: grid;
  grid-template-columns: repeat(7, minmax(30px, calc(var(--ngs-density, 1) * 44px)));
  gap: 2px;
}
.calendrier__semaine { text-align: center; font-size: .75rem; font-weight: 600; color: var(--ngs-color-text-muted, #5f5f66); }
.calendrier__jour {
  aspect-ratio: 1;
  min-width: 0;
  border: 0;
  border-radius: var(--ngs-radius, 10px);
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: .9375rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color var(--ngs-duration, 160ms) ease-out, color var(--ngs-duration, 160ms) ease-out;
}
.calendrier__jour:hover { background: var(--ngs-color-surface-alt, #f4f4f5); }
.calendrier__jour[aria-current="date"] { box-shadow: inset 0 0 0 1.5px var(--ngs-color-border, #8a8a93); font-weight: 650; }
.calendrier__jour[aria-pressed="true"] { background: var(--ngs-color-action, #0b0b0c); color: var(--ngs-color-on-action, #ffffff); font-weight: 650; }
.calendrier__jour:focus-visible, .calendrier__nav:focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 2px; }
.calendrier__choix { margin: 0; font-size: .875rem; color: var(--ngs-color-text-muted, #5f5f66); }
.calendrier__choix strong { color: var(--ngs-color-text, #0b0b0c); font-weight: 600; }
/* Animation : au changement de mois, les jours glissent de 12 px dans le sens de navigation. */
@media (prefers-reduced-motion: no-preference) {
  .calendrier__jours--suivant { animation: ngs-mois-suivant calc(var(--ngs-duration, 160ms) * 1.5) cubic-bezier(.22, 1, .36, 1) both; }
  .calendrier__jours--precedent { animation: ngs-mois-precedent calc(var(--ngs-duration, 160ms) * 1.5) cubic-bezier(.22, 1, .36, 1) both; }
}
@keyframes ngs-mois-suivant { from { opacity: 0; transform: translateX(12px); } }
@keyframes ngs-mois-precedent { from { opacity: 0; transform: translateX(-12px); } }
/* Désactivable : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation) .calendrier__jours { animation: none; }
:host-context(.ngs-sans-animation) .calendrier__jours { animation: none; }`,
    tw: {
      ':host': 'block max-w-full font-ngs text-ngs-text',
      calendrier: 'grid w-max max-w-full gap-ngs-3 rounded-[calc(var(--radius-ngs)*1.6)] bg-ngs-surface px-[clamp(8px,3vw,var(--spacing-ngs-4))] py-ngs-4 shadow-[inset_0_0_0_1px_var(--color-ngs-border)]',
      calendrier__tete: 'flex items-center gap-1',
      calendrier__mois: 'm-0 flex-1 pl-1.5 text-base font-semibold first-letter:uppercase',
      calendrier__nav: 'inline-grid size-11 cursor-pointer place-items-center rounded-ngs border-0 bg-transparent text-inherit transition-colors duration-(--ngs-duration) hover:bg-ngs-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ngs-action [&_svg]:size-[18px]',
      calendrier__semaine: 'grid grid-cols-[repeat(7,minmax(30px,var(--spacing-ngs-11)))] gap-0.5 text-center text-xs font-semibold text-ngs-text-muted',
      calendrier__jours: 'grid grid-cols-[repeat(7,minmax(30px,var(--spacing-ngs-11)))] gap-0.5 in-[.ngs-sans-animation]:animate-none!',
      'calendrier__jours--suivant': 'motion-safe:animate-[ngs-mois-suivant_calc(var(--ngs-duration)*1.5)_cubic-bezier(.22,1,.36,1)_both]',
      'calendrier__jours--precedent': 'motion-safe:animate-[ngs-mois-precedent_calc(var(--ngs-duration)*1.5)_cubic-bezier(.22,1,.36,1)_both]',
      calendrier__jour: 'aspect-square min-w-0 cursor-pointer rounded-ngs border-0 bg-transparent text-[15px] tabular-nums text-inherit transition-colors duration-(--ngs-duration) hover:bg-ngs-surface-alt aria-[current=date]:font-semibold aria-[current=date]:shadow-[inset_0_0_0_1.5px_var(--color-ngs-border)] aria-pressed:bg-ngs-action aria-pressed:font-semibold aria-pressed:text-ngs-on-action aria-pressed:hover:bg-ngs-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ngs-action',
      calendrier__choix: 'm-0 text-sm text-ngs-text-muted [&_strong]:font-semibold [&_strong]:text-ngs-text'
    },
    demo: `<div class="calendrier"><div class="calendrier__tete"><p class="calendrier__mois" aria-live="polite"></p><button class="calendrier__nav" type="button" data-pas="-1" aria-label="Mois précédent">${SVG.gauche}</button><button class="calendrier__nav" type="button" data-pas="1" aria-label="Mois suivant">${SVG.droite}</button></div><div class="calendrier__semaine" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="calendrier__jours"></div><p class="calendrier__choix">Date choisie : <strong>aucune</strong></p></div>`,
    init: function (root, cls) {
      var libelle = root.querySelector('.calendrier__mois');
      var grille = root.querySelector('.calendrier__jours');
      var choix = root.querySelector('.calendrier__choix strong');
      var auj = new Date(); auj.setHours(0, 0, 0, 0);
      var vue = new Date(auj.getFullYear(), auj.getMonth(), 1);
      var selection = new Date(auj.getFullYear(), auj.getMonth(), Math.min(auj.getDate() + 2, 28));
      var focus = selection;
      var fMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
      var fJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      function meme(a, b) { return !!a && !!b && a.getTime() === b.getTime(); }
      // Équivalent de [animate.enter] : la grille rejoue son entrée dans le sens du changement de mois.
      var classes = { '1': cls('calendrier__jours--suivant').split(' '), '-1': cls('calendrier__jours--precedent').split(' ') };
      function glisser(sens) {
        classes['1'].concat(classes['-1']).forEach(function (c) { grille.classList.remove(c); });
        void grille.offsetWidth;
        classes[String(sens)].forEach(function (c) { grille.classList.add(c); });
      }
      function rendre(focaliser) {
        libelle.textContent = fMois.format(vue);
        grille.textContent = '';
        var decalage = (vue.getDay() + 6) % 7;
        var nb = new Date(vue.getFullYear(), vue.getMonth() + 1, 0).getDate();
        for (var i = 0; i < decalage; i++) grille.appendChild(document.createElement('span'));
        for (var j = 1; j <= nb; j++) {
          var d = new Date(vue.getFullYear(), vue.getMonth(), j);
          var b = document.createElement('button');
          b.type = 'button';
          b.className = cls('calendrier__jour');
          b.textContent = String(j);
          b.dataset.jour = String(j);
          b.setAttribute('aria-label', fJour.format(d));
          b.setAttribute('aria-pressed', String(meme(d, selection)));
          if (meme(d, auj)) b.setAttribute('aria-current', 'date');
          b.tabIndex = meme(d, focus) ? 0 : -1;
          grille.appendChild(b);
        }
        if (!grille.querySelector('[tabindex="0"]')) grille.querySelector('.calendrier__jour').tabIndex = 0;
        choix.textContent = selection ? fJour.format(selection) : 'aucune';
        if (focaliser) grille.querySelector('[tabindex="0"]').focus();
      }
      root.querySelectorAll('.calendrier__nav').forEach(function (n) {
        n.addEventListener('click', function () {
          vue = new Date(vue.getFullYear(), vue.getMonth() + Number(n.dataset.pas), 1);
          focus = vue;
          rendre(false);
          glisser(Number(n.dataset.pas));
        });
      });
      grille.addEventListener('click', function (e) {
        var b = e.target.closest('.calendrier__jour');
        if (!b) return;
        selection = new Date(vue.getFullYear(), vue.getMonth(), Number(b.dataset.jour));
        focus = selection;
        rendre(true);
      });
      grille.addEventListener('keydown', function (e) {
        var pas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (pas === undefined && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        var d = new Date(focus);
        if (pas !== undefined) d.setDate(d.getDate() + pas);
        else if (e.key === 'Home') d = new Date(vue.getFullYear(), vue.getMonth(), 1);
        else d = new Date(vue.getFullYear(), vue.getMonth() + 1, 0);
        focus = d;
        var avant = vue;
        vue = new Date(d.getFullYear(), d.getMonth(), 1);
        rendre(true);
        if (vue.getTime() !== avant.getTime()) glisser(vue > avant ? 1 : -1);
      });
      rendre(false);
    },
    usage: `<ngs-calendrier [(selection)]="dateDeLivraison" />`,
    api: [
      { nom: 'selection', type: 'model<Date | null>()', defaut: 'null', role: 'Date choisie, liable en [(selection)].' },
      { nom: 'locale', type: 'input<string>()', defaut: "'fr-FR'", role: 'Langue des libellés (Intl).' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false : le mois change sans glisser (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' }
    ],
    motion: {
      resume: 'Au changement de mois, les jours glissent de 12 px dans le sens de la navigation.',
      moments: ['changement'],
      technique: '[animate.enter] d’Angular sur la grille du mois, @keyframes CSS'
    },
    keyframesTailwind: '@keyframes ngs-mois-suivant {\n  from { opacity: 0; transform: translateX(12px); }\n}\n@keyframes ngs-mois-precedent {\n  from { opacity: 0; transform: translateX(-12px); }\n}\n',
    angular: {
      nom: 'calendrier',
      ts: `import {
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

const PAS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

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
    () => new Intl.DateTimeFormat(this.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  );
  /** Cases vides avant le 1er (semaine commençant le lundi). */
  protected readonly decalage = computed(() => Array.from({ length: (this.vue().getDay() + 6) % 7 }));
  protected readonly jours = computed<Jour[]>(() => {
    const v = this.vue();
    const nombre = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
    return Array.from({ length: nombre }, (_, i) => ({ date: new Date(v.getFullYear(), v.getMonth(), i + 1), numero: i + 1 }));
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
    afterNextRender(() => this.grille().nativeElement.querySelector<HTMLElement>('[tabindex="0"]')?.focus(), {
      injector: this.injector,
    });
  }

  protected estAujourdhui(d: Date): boolean {
    return d.getTime() === this.aujourdhui.getTime();
  }

  protected estChoisi(d: Date): boolean {
    return d.getTime() === this.selection()?.getTime();
  }

  protected estFocus(d: Date): boolean {
    const f = this.focus();
    return f.getMonth() === this.vue().getMonth() ? d.getTime() === debutDuJour(f).getTime() : d.getDate() === 1;
  }
}

function debutDuJour(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function premierDuMois(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}`,
      html: `<div class="calendrier">
  <div class="calendrier__tete">
    <p class="calendrier__mois" aria-live="polite">{{ libelleMois() }}</p>
    <button class="calendrier__nav" type="button" aria-label="Mois précédent" (click)="changerDeMois(-1)">
      ${SVG.gauche}
    </button>
    <button class="calendrier__nav" type="button" aria-label="Mois suivant" (click)="changerDeMois(1)">
      ${SVG.droite}
    </button>
  </div>

  <div class="calendrier__semaine" aria-hidden="true">
    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
  </div>

  <!-- Une grille par mois (clé = date du 1er) : [animate.enter] rejoue l'entrée dans le sens de navigation. -->
  @for (cle of [vue().getTime()]; track cle) {
  <div
    class="calendrier__jours"
    #grille
    [animate.enter]="sens() > 0 ? 'calendrier__jours--suivant' : sens() < 0 ? 'calendrier__jours--precedent' : ''"
    (keydown)="clavier($event)"
  >
    @for (vide of decalage(); track $index) {
      <span></span>
    }
    @for (jour of jours(); track jour.numero) {
      <button
        class="calendrier__jour"
        type="button"
        [attr.aria-label]="libelle(jour.date)"
        [attr.aria-pressed]="estChoisi(jour.date)"
        [attr.aria-current]="estAujourdhui(jour.date) ? 'date' : null"
        [tabindex]="estFocus(jour.date) ? 0 : -1"
        (click)="choisir(jour)"
      >
        {{ jour.numero }}
      </button>
    }
  </div>
  }

  <p class="calendrier__choix">Date choisie : <strong>{{ libelleChoix() }}</strong></p>
</div>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 3. Curseur                                                          */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'curseur', famille: 'composants', type: 'champ', secteurs: [],
    titre: 'Curseur de valeur',
    description: 'Régler une valeur continue en voyant le résultat écrit en grand, avec ses bornes.',
    tags: ['formulaire', 'slider', 'range', 'réglage'],
    css: BASE + `:host {
  display: block;
  font-family: var(--ngs-font-family, system-ui, sans-serif);
  color: var(--ngs-color-text, #0b0b0c);
}
.curseur { display: grid; gap: calc(var(--ngs-density, 1) * 10px); width: 100%; min-width: min(14rem, 100%); }
.curseur__tete { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.curseur__label { font-weight: 600; }
.curseur__valeur { font-variant-numeric: tabular-nums; font-weight: 650; font-size: 1.25rem; }
.curseur__piste {
  width: 100%;
  height: 44px;
  margin: 0;
  background: transparent;
  accent-color: var(--ngs-color-action, #0b0b0c);
  cursor: pointer;
}
.curseur__piste:focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 4px; border-radius: 4px; }
.curseur__bornes {
  display: flex;
  justify-content: space-between;
  font-size: .8125rem;
  color: var(--ngs-color-text-muted, #5f5f66);
  font-variant-numeric: tabular-nums;
}`,
    tw: {
      ':host': 'block font-ngs text-ngs-text',
      curseur: 'grid w-full min-w-[min(14rem,100%)] gap-ngs-2',
      curseur__tete: 'flex items-baseline justify-between gap-3',
      curseur__label: 'font-semibold',
      curseur__valeur: 'text-xl font-semibold tabular-nums',
      curseur__piste: 'm-0 h-11 w-full cursor-pointer bg-transparent accent-ngs-action focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ngs-action',
      curseur__bornes: 'flex justify-between text-[13px] tabular-nums text-ngs-text-muted'
    },
    demo: `<div class="curseur"><div class="curseur__tete"><label class="curseur__label" for="distance">Distance maximale</label><output class="curseur__valeur" for="distance">12 km</output></div><input class="curseur__piste" id="distance" type="range" min="1" max="50" step="1" value="12" aria-valuetext="12 km"><div class="curseur__bornes" aria-hidden="true"><span>1 km</span><span>50 km</span></div></div>`,
    init: function (root) {
      var i = root.querySelector('.curseur__piste');
      var o = root.querySelector('.curseur__valeur');
      i.addEventListener('input', function () {
        o.textContent = i.value + ' km';
        i.setAttribute('aria-valuetext', i.value + ' km');
      });
    },
    usage: `<ngs-curseur label="Distance maximale" unite="km" [min]="1" [max]="50" [(valeur)]="distance" />`,
    api: [
      { nom: 'label', type: 'input.required<string>()', defaut: '—', role: 'Libellé lié au champ.' },
      { nom: 'unite', type: 'input<string>()', defaut: "''", role: 'Unité affichée après la valeur.' },
      { nom: 'min / max / pas', type: 'input<number>()', defaut: '0 / 100 / 1', role: 'Bornes et pas.' },
      { nom: 'valeur', type: 'model<number>()', defaut: '50', role: 'Valeur, liable en [(valeur)].' }
    ],
    angular: {
      nom: 'curseur',
      ts: `import { ChangeDetectionStrategy, Component, computed, input, model, numberAttribute } from '@angular/core';

let compteur = 0;

@Component({
  selector: 'ngs-curseur',
  templateUrl: './curseur.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurseurComponent {
  readonly label = input.required<string>();
  readonly unite = input('');
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly pas = input(1, { transform: numberAttribute });
  readonly valeur = model(50);

  protected readonly id = 'ngs-curseur-' + compteur++;
  protected readonly texte = computed(() => (this.valeur() + ' ' + this.unite()).trim());

  protected changer(evenement: Event): void {
    this.valeur.set((evenement.target as HTMLInputElement).valueAsNumber);
  }
}`,
      html: `<div class="curseur">
  <div class="curseur__tete">
    <label class="curseur__label" [for]="id">{{ label() }}</label>
    <output class="curseur__valeur" [for]="id">{{ texte() }}</output>
  </div>
  <input
    class="curseur__piste"
    type="range"
    [id]="id"
    [min]="min()"
    [max]="max()"
    [step]="pas()"
    [value]="valeur()"
    [attr.aria-valuetext]="texte()"
    (input)="changer($event)"
  />
  <div class="curseur__bornes" aria-hidden="true">
    <span>{{ min() }} {{ unite() }}</span>
    <span>{{ max() }} {{ unite() }}</span>
  </div>
</div>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 4. Champ e-mail                                                     */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'champ-email', famille: 'composants', type: 'champ', secteurs: [],
    titre: 'Champ e-mail validé',
    description: 'Un champ avec label visible, aide, et une erreur qui dit quoi corriger, au bon moment (à la sortie du champ).',
    tags: ['formulaire', 'input', 'validation', 'email'],
    css: BASE + `:host {
  display: block;
  font-family: var(--ngs-font-family, system-ui, sans-serif);
  color: var(--ngs-color-text, #0b0b0c);
}
.champ { display: grid; gap: calc(var(--ngs-density, 1) * 6px); width: 100%; min-width: min(14rem, 100%); }
.champ__label { font-weight: 600; font-size: .9375rem; }
.champ__saisie {
  width: 100%;
  min-height: calc(var(--ngs-density, 1) * 48px);
  padding: 0 calc(var(--ngs-density, 1) * 14px);
  border: 1.5px solid var(--ngs-color-border, #8a8a93);
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-surface, #ffffff);
  color: inherit;
  font: inherit;
  font-size: 1rem;
  caret-color: var(--ngs-color-action, #0b0b0c);
  transition: border-color var(--ngs-duration, 160ms) ease-out, box-shadow var(--ngs-duration, 160ms) ease-out;
}
.champ__saisie::placeholder { color: var(--ngs-color-text-muted, #5f5f66); opacity: 1; }
.champ__saisie:focus {
  outline: none;
  border-color: var(--ngs-color-action, #0b0b0c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ngs-color-action, #0b0b0c) 22%, transparent);
}
.champ__saisie[aria-invalid="true"] { border-color: var(--ngs-color-danger, #b42318); }
.champ__saisie[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ngs-color-danger, #b42318) 22%, transparent); }
.champ__aide { margin: 0; font-size: .875rem; color: var(--ngs-color-text-muted, #5f5f66); }
.champ__erreur { margin: 0; display: flex; gap: 6px; align-items: flex-start; font-size: .875rem; font-weight: 550; color: var(--ngs-color-danger, #b42318); }
.champ__erreur svg { flex: none; width: 18px; height: 18px; margin-top: 1px; }`,
    tw: {
      ':host': 'block font-ngs text-ngs-text',
      champ: 'grid w-full min-w-[min(14rem,100%)] gap-ngs-2',
      champ__label: 'text-[15px] font-semibold',
      champ__saisie: 'min-h-ngs-12 w-full rounded-ngs border-[1.5px] border-ngs-border bg-ngs-surface px-ngs-4 text-base text-inherit caret-ngs-action transition-[border-color,box-shadow] duration-(--ngs-duration) placeholder:text-ngs-text-muted focus:border-ngs-action focus:ring-3 focus:ring-ngs-action/20 focus:outline-none aria-invalid:border-ngs-danger aria-invalid:focus:ring-ngs-danger/20',
      champ__aide: 'm-0 text-sm text-ngs-text-muted',
      champ__erreur: 'm-0 flex items-start gap-1.5 text-sm font-medium text-ngs-danger [&_svg]:mt-px [&_svg]:size-[18px] [&_svg]:flex-none'
    },
    demo: `<div class="champ"><label class="champ__label" for="email">Adresse e-mail</label><input class="champ__saisie" id="email" type="email" autocomplete="email" placeholder="awa@exemple.sn" value="awa@exemple" aria-describedby="email-aide email-erreur" aria-invalid="true"><p class="champ__aide" id="email-aide">Pour recevoir le reçu de commande.</p><p class="champ__erreur" id="email-erreur">${SVG.alerte}<span>Ajoutez la fin de l’adresse, par exemple awa@exemple.sn.</span></p></div>`,
    init: function (root) {
      var i = root.querySelector('.champ__saisie');
      var e = root.querySelector('.champ__erreur');
      function valider() {
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value.trim());
        i.setAttribute('aria-invalid', String(!ok));
        e.hidden = ok;
        e.querySelector('span').textContent = i.value.trim() === '' ? 'Saisissez votre adresse e-mail.' : 'Ajoutez la fin de l’adresse, par exemple awa@exemple.sn.';
      }
      i.addEventListener('blur', valider);
      i.addEventListener('input', valider);
    },
    usage: `<ngs-champ-email
  #champ
  label="Adresse e-mail"
  aide="Pour recevoir le reçu de commande."
  [(valeur)]="email"
/>
<button [disabled]="!champ.valide()">Envoyer le reçu</button>`,
    api: [
      { nom: 'label', type: 'input.required<string>()', defaut: '—', role: 'Libellé visible.' },
      { nom: 'aide', type: 'input<string>()', defaut: "''", role: 'Phrase d’aide.' },
      { nom: 'valeur', type: 'model<string>()', defaut: "''", role: 'Adresse saisie, liable en [(valeur)].' },
      { nom: 'valide', type: 'Signal<boolean>', defaut: '—', role: 'Lecture seule : l’adresse est complète.' }
    ],
    angular: {
      nom: 'champ-email',
      ts: `import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

const MOTIF_EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;
let compteur = 0;

@Component({
  selector: 'ngs-champ-email',
  templateUrl: './champ-email.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChampEmailComponent {
  readonly label = input.required<string>();
  readonly aide = input('');
  readonly valeur = model('');

  protected readonly id = 'ngs-champ-' + compteur++;
  /** L’erreur ne s’affiche qu’après la première sortie du champ. */
  protected readonly touche = signal(false);
  readonly valide = computed(() => MOTIF_EMAIL.test(this.valeur().trim()));
  protected readonly enErreur = computed(() => this.touche() && !this.valide());
  protected readonly message = computed(() =>
    this.valeur().trim() === ''
      ? 'Saisissez votre adresse e-mail.'
      : 'Ajoutez la fin de l’adresse, par exemple awa@exemple.sn.',
  );

  protected saisir(evenement: Event): void {
    this.valeur.set((evenement.target as HTMLInputElement).value);
  }
}`,
      html: `<div class="champ">
  <label class="champ__label" [for]="id">{{ label() }}</label>
  <input
    class="champ__saisie"
    type="email"
    autocomplete="email"
    placeholder="awa@exemple.sn"
    [id]="id"
    [value]="valeur()"
    [attr.aria-invalid]="enErreur()"
    [attr.aria-describedby]="id + '-aide ' + id + '-erreur'"
    (input)="saisir($event)"
    (blur)="touche.set(true)"
  />
  @if (aide()) {
    <p class="champ__aide" [id]="id + '-aide'">{{ aide() }}</p>
  }
  @if (enErreur()) {
    <p class="champ__erreur" [id]="id + '-erreur'">
      ${SVG.alerte}
      <span>{{ message() }}</span>
    </p>
  }
</div>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 5. Notifications                                                    */
  /* ------------------------------------------------------------------ */
  var svgCocheNotif = SVG.coche.replace('<svg ', '<svg class="notification__icone" ');
  r.push({
    slug: 'notifications', famille: 'composants', type: 'notification', secteurs: [],
    titre: 'Notifications',
    description: 'Des messages courts qui confirment une action, se ferment seuls après cinq secondes et sont lus par les lecteurs d’écran.',
    tags: ['toast', 'retour', 'message', 'snackbar'],
    taille: 'ngs-case--wide',
    css: BASE + `:host {
  display: block;
  font-family: var(--ngs-font-family, system-ui, sans-serif);
  color: var(--ngs-color-text, #0b0b0c);
}
.demo-notif { display: grid; gap: 16px; justify-items: start; width: 100%; min-width: min(16rem, 100%); }
.demo-notif__bouton {
  min-height: calc(var(--ngs-density, 1) * 48px);
  padding: 0 calc(var(--ngs-density, 1) * 18px);
  border: 0;
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-action, #0b0b0c);
  color: var(--ngs-color-on-action, #ffffff);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.notifications { display: grid; gap: calc(var(--ngs-density, 1) * 8px); width: 100%; margin: 0; padding: 0; list-style: none; }
.notification {
  display: flex;
  align-items: center;
  gap: calc(var(--ngs-density, 1) * 12px);
  padding: calc(var(--ngs-density, 1) * 10px) calc(var(--ngs-density, 1) * 8px) calc(var(--ngs-density, 1) * 10px) calc(var(--ngs-density, 1) * 14px);
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93), 0 8px 24px -12px rgb(0 0 0 / .35);
}
.notification__icone { flex: none; width: 20px; height: 20px; color: var(--ngs-color-action, #0b0b0c); }
.notification__texte { flex: 1; font-size: .9375rem; }
.notification__fermer {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--ngs-radius, 10px);
  background: transparent;
  color: var(--ngs-color-text-muted, #5f5f66);
  cursor: pointer;
}
.notification__fermer:hover { background: var(--ngs-color-surface-alt, #f4f4f5); color: var(--ngs-color-text, #0b0b0c); }
.notification__fermer svg { width: 18px; height: 18px; }
/* Animations : entrée et sortie qui glissent depuis la droite (classes posées par animate.enter / animate.leave). */
@media (prefers-reduced-motion: no-preference) {
  .notification--entree { animation: ngs-notif-entree calc(var(--ngs-duration, 160ms) * 1.75) cubic-bezier(.22, 1, .36, 1) both; }
  .notification--sortie { animation: ngs-notif-sortie var(--ngs-duration, 160ms) cubic-bezier(.65, 0, .35, 1) both; }
}
@keyframes ngs-notif-entree { from { opacity: 0; transform: translateX(16px); } }
@keyframes ngs-notif-sortie { to { opacity: 0; transform: translateX(16px); } }
/* Désactivables : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation) .notification { animation: none; }
:host-context(.ngs-sans-animation) .notification { animation: none; }`,
    tw: {
      ':host': 'block font-ngs text-ngs-text',
      'demo-notif': 'grid w-full min-w-[min(16rem,100%)] justify-items-start gap-4',
      'demo-notif__bouton': 'min-h-ngs-12 cursor-pointer rounded-ngs border-0 bg-ngs-action px-ngs-5 font-semibold text-ngs-on-action',
      notifications: 'm-0 grid w-full list-none gap-ngs-2 p-0',
      notification: 'flex items-center gap-ngs-3 rounded-ngs bg-ngs-surface py-ngs-3 pr-ngs-2 pl-ngs-4 shadow-[inset_0_0_0_1px_var(--color-ngs-border),0_8px_24px_-12px_rgb(0_0_0/.35)] in-[.ngs-sans-animation]:animate-none!',
      'notification--entree': 'motion-safe:animate-[ngs-notif-entree_calc(var(--ngs-duration)*1.75)_cubic-bezier(.22,1,.36,1)_both]',
      'notification--sortie': 'motion-safe:animate-[ngs-notif-sortie_var(--ngs-duration)_cubic-bezier(.65,0,.35,1)_both]',
      notification__icone: 'size-5 flex-none text-ngs-action',
      notification__texte: 'flex-1 text-[15px]',
      notification__fermer: 'inline-grid size-11 flex-none cursor-pointer place-items-center rounded-ngs border-0 bg-transparent text-ngs-text-muted hover:bg-ngs-surface-alt hover:text-ngs-text [&_svg]:size-[18px]'
    },
    demo: `<div class="demo-notif"><button class="demo-notif__bouton" type="button">Enregistrer le brouillon</button><ul class="notifications" aria-live="polite" aria-label="Notifications"></ul></div>`,
    init: function (root, cls) {
      var liste = root.querySelector('.notifications');
      var n = 0;
      var messages = ['Brouillon enregistré', 'Brouillon enregistré à nouveau', 'Toujours enregistré, rien n’est perdu'];
      // Équivalent de animate.leave : la classe de sortie est posée, l'élément part à la fin de l'animation
      // (tout de suite si aucune animation ne tourne : animations coupées ou mouvement réduit).
      function retirer(li) {
        if (!li.isConnected || li._sortie) return;
        li._sortie = true;
        cls('notification--entree').split(' ').forEach(function (c) { li.classList.remove(c); });
        cls('notification--sortie').split(' ').forEach(function (c) { li.classList.add(c); });
        var nom = getComputedStyle(li).animationName;
        if (!nom || nom === 'none') { li.remove(); return; }
        li.addEventListener('animationend', function () { li.remove(); }, { once: true });
        setTimeout(function () { li.remove(); }, 800);
      }
      root.querySelector('.demo-notif__bouton').addEventListener('click', function () {
        var li = document.createElement('li');
        li.className = cls('notification') + ' ' + cls('notification--entree');
        li.innerHTML = svgCocheNotif.replace('class="notification__icone"', 'class="' + cls('notification__icone') + '"') +
          '<span class="' + cls('notification__texte') + '"></span><button class="' + cls('notification__fermer') + '" type="button" aria-label="Fermer la notification">' + SVG.x + '</button>';
        li.querySelector('span').textContent = messages[Math.min(n++, messages.length - 1)];
        li.querySelector('button').addEventListener('click', function () { retirer(li); });
        liste.prepend(li);
        while (liste.children.length > 3) liste.lastElementChild.remove();
        setTimeout(function () { retirer(li); }, 5000);
      });
    },
    usage: `// dans un composant
private readonly notifications = inject(NotificationsService);

enregistrer(): void {
  this.notifications.afficher('Brouillon enregistré');
}

<!-- une seule fois, dans app.component.html -->
<ngs-notifications />`,
    api: [
      { nom: 'afficher(texte)', type: 'NotificationsService', defaut: '—', role: 'Ajoute une notification (3 au plus à l’écran).' },
      { nom: 'retirer(id)', type: 'NotificationsService', defaut: '—', role: 'Ferme une notification.' },
      { nom: 'duree', type: 'number (ms)', defaut: '5000', role: 'Délai avant fermeture automatique.' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false coupe l’entrée et la sortie (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' }
    ],
    motion: {
      resume: 'Chaque notification glisse depuis la droite en entrant, puis repart de la même façon.',
      moments: ['entree', 'sortie'],
      technique: 'animate.enter / animate.leave d’Angular, @keyframes CSS'
    },
    demos: {
      // Variante de démo utilisée par la vitrine de l'accueil (une notification déjà affichée).
      toast: '<ul class="notifications" aria-label="Notifications"><li class="notification">' + svgCocheNotif +
        '<span class="notification__texte">Table réservée pour vendredi soir</span></li></ul>'
    },
    keyframesTailwind: '@keyframes ngs-notif-entree {\n  from { opacity: 0; transform: translateX(16px); }\n}\n@keyframes ngs-notif-sortie {\n  to { opacity: 0; transform: translateX(16px); }\n}\n',
    angular: {
      nom: 'notifications',
      extras: [{
        nom: 'notifications.service.ts', langage: 'ts',
        code: `import { Injectable, signal } from '@angular/core';

export interface Notification {
  readonly id: number;
  readonly texte: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private suivant = 0;
  private readonly _liste = signal<readonly Notification[]>([]);
  readonly liste = this._liste.asReadonly();
  readonly duree = 5000;

  afficher(texte: string): void {
    const notification: Notification = { id: this.suivant++, texte };
    this._liste.update((l) => [notification, ...l].slice(0, 3));
    setTimeout(() => this.retirer(notification.id), this.duree);
  }

  retirer(id: number): void {
    this._liste.update((l) => l.filter((n) => n.id !== id));
  }
}`
      }],
      ts: `import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { NotificationsService } from './notifications.service';

@Component({
  selector: 'ngs-notifications',
  templateUrl: './notifications.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  /** false : pas d'animation d'entrée ni de sortie. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly service = inject(NotificationsService);
}`,
      html: `<ul class="notifications" aria-live="polite" aria-label="Notifications">
  @for (n of service.liste(); track n.id) {
    <li class="notification" animate.enter="notification--entree" animate.leave="notification--sortie">
      ${svgCocheNotif}
      <span class="notification__texte">{{ n.texte }}</span>
      <button class="notification__fermer" type="button" aria-label="Fermer la notification" (click)="service.retirer(n.id)">
        ${SVG.x}
      </button>
    </li>
  }
</ul>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 6. Boutons                                                          */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'boutons', famille: 'composants', type: 'bouton', secteurs: [],
    titre: 'Boutons',
    description: 'Trois variantes (principale, secondaire, discrète), un état de chargement annoncé et une cible tactile de 44 px.',
    tags: ['bouton', 'action', 'cta', 'chargement'],
    css: BASE + `:host { display: inline-block; font-family: var(--ngs-font-family, system-ui, sans-serif); }
.bouton {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--ngs-density, 1) * 8px);
  min-height: max(44px, calc(var(--ngs-density, 1) * 48px));
  padding: 0 calc(var(--ngs-density, 1) * 20px);
  border: 1.5px solid var(--ngs-color-action, #0b0b0c);
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-action, #0b0b0c);
  color: var(--ngs-color-on-action, #ffffff);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--ngs-duration, 160ms) ease-out, filter var(--ngs-duration, 160ms) ease-out, background-color var(--ngs-duration, 160ms) ease-out;
}
.bouton:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
.bouton:active:not(:disabled) { transform: translateY(1px) scale(.985); }
.bouton:focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 3px; }
.bouton:disabled { opacity: .45; cursor: not-allowed; }
.bouton[data-variante="secondaire"] { background: var(--ngs-color-surface, #ffffff); color: var(--ngs-color-text, #0b0b0c); border-color: var(--ngs-color-text, #0b0b0c); }
.bouton[data-variante="discrete"] { background: transparent; color: var(--ngs-color-text, #0b0b0c); border-color: transparent; }
.bouton[data-variante="discrete"]:hover:not(:disabled) { background: var(--ngs-color-surface-alt, #f4f4f5); filter: none; }
.bouton[aria-busy="true"] { color: transparent; pointer-events: none; }
.bouton__roue { display: none; }
.bouton[aria-busy="true"] .bouton__roue {
  display: block;
  position: absolute;
  inset: 0;
  margin: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--ngs-color-on-action, #ffffff);
  border-right-color: transparent;
  animation: ngs-tourne 700ms linear infinite;
}
@keyframes ngs-tourne { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .bouton { transition: none; } .bouton[aria-busy="true"] .bouton__roue { animation-duration: 2s; } }`,
    tw: {
      ':host': 'inline-block font-ngs',
      bouton: 'relative inline-flex min-h-[max(44px,var(--spacing-ngs-12))] cursor-pointer items-center justify-center gap-ngs-2 rounded-ngs border-[1.5px] border-ngs-action bg-ngs-action px-ngs-5 font-semibold text-ngs-on-action transition duration-(--ngs-duration) not-disabled:hover:-translate-y-px not-disabled:hover:brightness-110 not-disabled:active:translate-y-px not-disabled:active:scale-[.985] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ngs-action disabled:cursor-not-allowed disabled:opacity-45 data-[variante=secondaire]:border-ngs-text data-[variante=secondaire]:bg-ngs-surface data-[variante=secondaire]:text-ngs-text data-[variante=discrete]:border-transparent data-[variante=discrete]:bg-transparent data-[variante=discrete]:text-ngs-text data-[variante=discrete]:hover:bg-ngs-surface-alt data-[variante=discrete]:hover:brightness-100 aria-busy:pointer-events-none aria-busy:text-transparent motion-reduce:transition-none',
      bouton__roue: 'hidden in-aria-busy:absolute in-aria-busy:inset-0 in-aria-busy:m-auto in-aria-busy:block in-aria-busy:size-[18px] in-aria-busy:animate-spin in-aria-busy:rounded-full in-aria-busy:border-2 in-aria-busy:border-ngs-on-action in-aria-busy:border-r-transparent'
    },
    demo: `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center"><button class="bouton" type="button" data-variante="principale">Réserver une table<span class="bouton__roue" aria-hidden="true"></span></button><button class="bouton" type="button" data-variante="secondaire">Voir la carte<span class="bouton__roue" aria-hidden="true"></span></button><button class="bouton" type="button" data-variante="discrete">Annuler<span class="bouton__roue" aria-hidden="true"></span></button></div>`,
    init: function (root) {
      var b = root.querySelector('[data-variante="principale"]');
      b.addEventListener('click', function () {
        b.setAttribute('aria-busy', 'true');
        setTimeout(function () { b.removeAttribute('aria-busy'); }, 1400);
      });
    },
    usage: `<ngs-bouton (click)="reserver()" [chargement]="envoi()">Réserver une table</ngs-bouton>
<ngs-bouton variante="secondaire">Voir la carte</ngs-bouton>
<ngs-bouton variante="discrete">Annuler</ngs-bouton>`,
    api: [
      { nom: 'variante', type: "input<'principale' | 'secondaire' | 'discrete'>()", defaut: "'principale'", role: 'Poids visuel du bouton.' },
      { nom: 'type', type: "input<'button' | 'submit'>()", defaut: "'button'", role: 'Type natif du bouton.' },
      { nom: 'chargement', type: 'input<boolean>()', defaut: 'false', role: 'Désactive et annonce aria-busy.' },
      { nom: 'desactive', type: 'input<boolean>()', defaut: 'false', role: 'Bouton inactif.' }
    ],
    angular: {
      nom: 'bouton',
      ts: `import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type VarianteBouton = 'principale' | 'secondaire' | 'discrete';

@Component({
  selector: 'ngs-bouton',
  templateUrl: './bouton.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutonComponent {
  readonly variante = input<VarianteBouton>('principale');
  readonly type = input<'button' | 'submit'>('button');
  readonly chargement = input(false, { transform: booleanAttribute });
  readonly desactive = input(false, { transform: booleanAttribute });
}`,
      html: `<button
  class="bouton"
  [type]="type()"
  [attr.data-variante]="variante()"
  [attr.aria-busy]="chargement() || null"
  [disabled]="desactive() || chargement()"
>
  <ng-content />
  <span class="bouton__roue" aria-hidden="true"></span>
</button>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 7. Carte de séjour (voyage)                                         */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'carte-sejour', famille: 'composants', type: 'carte', secteurs: ['voyage'],
    titre: 'Carte de séjour',
    description: 'Une carte cliquable en entier : photo, lieu, titre, prix. Le lien porte sur le titre, la zone de clic couvre la carte.',
    tags: ['card', 'carte', 'voyage', 'hôtel', 'photo'],
    css: BASE + `:host { display: block; width: 100%; max-width: 22rem; margin-inline: auto; font-family: var(--ngs-font-family, system-ui, sans-serif); color: var(--ngs-color-text, #0b0b0c); container-type: inline-size; }
.sejour {
  position: relative;
  display: grid;
  overflow: hidden;
  border-radius: calc(var(--ngs-radius, 10px) * 1.6);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93);
}
.sejour:hover { box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93), 0 12px 24px -12px rgb(0 0 0 / .3); }
.sejour__cadre { overflow: hidden; aspect-ratio: 4 / 3; }
.sejour__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.sejour__corps { display: grid; gap: calc(var(--ngs-density, 1) * 6px); padding: calc(var(--ngs-density, 1) * 16px); }
.sejour__lieu { margin: 0; display: flex; align-items: center; gap: 6px; font-size: .875rem; color: var(--ngs-color-text-muted, #5f5f66); }
.sejour__lieu svg { width: 16px; height: 16px; }
.sejour__titre { margin: 0; font-size: 1.125rem; line-height: 1.3; }
.sejour__lien { color: inherit; text-decoration: none; }
.sejour__lien::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.sejour__lien:focus-visible { outline: none; }
.sejour:has(.sejour__lien:focus-visible) { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 3px; }
.sejour__texte { margin: 0; font-size: .9375rem; color: var(--ngs-color-text-muted, #5f5f66); }
.sejour__prix { margin: calc(var(--ngs-density, 1) * 4px) 0 0; font-weight: 650; color: var(--ngs-color-action, #0b0b0c); font-variant-numeric: tabular-nums; }
/* Animations : la photo se pose à l'affichage (1,06 → 1), la carte monte de 2 px et la photo zoome au survol. */
@media (prefers-reduced-motion: no-preference) {
  .sejour { transition: transform var(--ngs-duration, 160ms) ease-out, box-shadow var(--ngs-duration, 160ms) ease-out; }
  .sejour:hover { transform: translateY(-2px); }
  .sejour__image { transition: transform 600ms cubic-bezier(.22, 1, .36, 1); animation: ngs-sejour-photo calc(var(--ngs-duration, 160ms) * 4) cubic-bezier(.22, 1, .36, 1) both; }
  .sejour:hover .sejour__image { transform: scale(1.03); }
}
@keyframes ngs-sejour-photo { from { opacity: 0; transform: scale(1.06); } }
/* Sortie (v0.4) : classe sejour-sortie posée sur l'hôte par animate.leave="sejour-sortie" (liste filtrée, suppression). */
@media (prefers-reduced-motion: no-preference) {
  :host(.sejour-sortie) { animation: ngs-sejour-sortie calc(var(--ngs-duration, 160ms) * 1.5) cubic-bezier(.65, 0, .35, 1) both; }
}
@keyframes ngs-sejour-sortie { to { opacity: 0; transform: scale(.96); } }
:host(.ngs-sans-animation.sejour-sortie) { animation: none; }
/* Désactivables : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation) .sejour, :host(.ngs-sans-animation) .sejour .sejour__image { transition: none; animation: none; transform: none; }
:host-context(.ngs-sans-animation) .sejour, :host-context(.ngs-sans-animation) .sejour .sejour__image { transition: none; animation: none; transform: none; }`,
    tw: {
      ':host': 'mx-auto block w-full max-w-[22rem] font-ngs text-ngs-text @container',
      sejour: 'group relative grid overflow-hidden rounded-[calc(var(--radius-ngs)*1.6)] bg-ngs-surface shadow-[inset_0_0_0_1px_var(--color-ngs-border)] hover:shadow-[inset_0_0_0_1px_var(--color-ngs-border),0_12px_24px_-12px_rgb(0_0_0/.3)] motion-safe:transition motion-safe:duration-(--ngs-duration) motion-safe:hover:-translate-y-0.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ngs-action in-[.ngs-sans-animation]:translate-none! in-[.ngs-sans-animation]:transition-none!',
      sejour__cadre: 'aspect-[4/3] overflow-hidden',
      sejour__image: 'block size-full object-cover motion-safe:animate-[ngs-sejour-photo_calc(var(--ngs-duration)*4)_cubic-bezier(.22,1,.36,1)_both] motion-safe:transition-transform motion-safe:duration-600 motion-safe:ease-[cubic-bezier(.22,1,.36,1)] motion-safe:group-hover:scale-[1.03] in-[.ngs-sans-animation]:scale-none! in-[.ngs-sans-animation]:animate-none! in-[.ngs-sans-animation]:transition-none!',
      sejour__corps: 'grid gap-ngs-2 p-ngs-4',
      sejour__lieu: 'm-0 flex items-center gap-1.5 text-sm text-ngs-text-muted [&_svg]:size-4',
      sejour__titre: 'm-0 text-lg leading-snug',
      sejour__lien: 'text-inherit no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[\'\'] focus-visible:outline-none',
      sejour__texte: 'm-0 text-[15px] text-ngs-text-muted',
      sejour__prix: 'mt-ngs-1 mb-0 font-semibold tabular-nums text-ngs-action',
      'sejour-sortie': 'motion-safe:animate-[ngs-sejour-sortie_calc(var(--ngs-duration)*1.5)_cubic-bezier(.65,0,.35,1)_both] in-[.ngs-sans-animation]:animate-none!'
    },
    demo: `<article class="sejour"><div class="sejour__cadre"><img class="sejour__image" src="${IMG}stlouis-640.webp" srcset="${IMG}stlouis-640.webp 640w, ${IMG}stlouis-1024.webp 1024w" sizes="22rem" width="640" height="427" alt="Pirogues colorées amarrées sur le fleuve à Saint-Louis du Sénégal, au lever du jour." decoding="async"></div><div class="sejour__corps"><p class="sejour__lieu">${SVG.repere}Saint-Louis, Sénégal</p><h3 class="sejour__titre"><a class="sejour__lien" href="#">Trois nuits au bord du fleuve</a></h3><p class="sejour__texte">Maison d’hôtes sur l’île, petit-déjeuner compris.</p><p class="sejour__prix">À partir de 85 000 F CFA</p></div></article>`,
    init: function (root) {
      root.querySelector('.sejour__lien').addEventListener('click', function (e) { e.preventDefault(); });
    },
    usage: `<!-- animate.leave (facultatif) : la carte s'efface quand elle quitte une liste -->
<ngs-carte-sejour
  animate.leave="sejour-sortie"
  lieu="Saint-Louis, Sénégal"
  titre="Trois nuits au bord du fleuve"
  texte="Maison d’hôtes sur l’île, petit-déjeuner compris."
  prix="À partir de 85 000 F CFA"
  image="/images/saint-louis.webp"
  alt="Pirogues amarrées sur le fleuve à Saint-Louis."
  lien="/sejours/saint-louis"
/>`,
    api: [
      { nom: 'lieu / titre / texte / prix', type: 'input.required<string>()', defaut: '—', role: 'Contenu de la carte (prix optionnel).' },
      { nom: 'image', type: 'input.required<string>()', defaut: '—', role: 'Chemin de la photo (NgOptimizedImage).' },
      { nom: 'alt', type: 'input.required<string>()', defaut: '—', role: 'Texte alternatif de la photo.' },
      { nom: 'lien', type: 'input.required<string>()', defaut: '—', role: 'Route ouverte par la carte (routerLink).' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false : ni photo qui se pose, ni montée au survol (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' }
    ],
    motion: {
      resume: 'La photo se pose à l’affichage ; au survol, la carte monte de 2 px et la photo zoome légèrement ; retirée d’une liste, la carte s’efface en rétrécissant.',
      moments: ['entree', 'survol', 'sortie'],
      technique: '@keyframes et transitions CSS ; sortie par animate.leave d’Angular (classe sejour-sortie sur l’hôte)',
      rejouer: { entree: true, sortie: 'sejour-sortie' }
    },
    keyframesTailwind: '@keyframes ngs-sejour-photo {\n  from { opacity: 0; transform: scale(1.06); }\n}\n@keyframes ngs-sejour-sortie {\n  to { opacity: 0; transform: scale(.96); }\n}\n/* Sortie : animate.leave=\"sejour-sortie\" dans le template parent pose cette classe sur l’hôte. */\n@media (prefers-reduced-motion: no-preference) {\n  :host(.sejour-sortie) { animation: ngs-sejour-sortie calc(var(--ngs-duration) * 1.5) cubic-bezier(.65, 0, .35, 1) both; }\n}\n:host(.ngs-sans-animation.sejour-sortie) { animation: none; }\n',
    angular: {
      nom: 'carte-sejour',
      ts: `import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ngs-carte-sejour',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './carte-sejour.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarteSejourComponent {
  readonly lieu = input.required<string>();
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly prix = input('');
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  readonly lien = input.required<string>();
  /** false : ni photo qui se pose, ni montée au survol. */
  readonly animations = input(true, { transform: booleanAttribute });
}`,
      html: `<article class="sejour">
  <div class="sejour__cadre">
    <img class="sejour__image" [ngSrc]="image()" [alt]="alt()" width="640" height="427" sizes="22rem" />
  </div>
  <div class="sejour__corps">
    <p class="sejour__lieu">
      ${SVG.repere}
      {{ lieu() }}
    </p>
    <h3 class="sejour__titre">
      <a class="sejour__lien" [routerLink]="lien()">{{ titre() }}</a>
    </h3>
    <p class="sejour__texte">{{ texte() }}</p>
    @if (prix()) {
      <p class="sejour__prix">{{ prix() }}</p>
    }
  </div>
</article>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 8. Bloc : questions fréquentes                                      */
  /* ------------------------------------------------------------------ */
  var faqItems = [
    ['Faut-il installer un paquet ?', 'Non. Vous copiez les fichiers du composant dans votre projet : il ne dépend que d’Angular.'],
    ['Puis-je l’utiliser dans un projet commercial ?', 'Oui. Chaque ressource est publiée sous licence MIT : gardez simplement la notice de licence.'],
    ['Comment changer les couleurs ?', 'Posez les variables du contrat (--ngs-color-action, --ngs-radius…) dans votre feuille de style : le composant les reprend.']
  ];
  r.push({
    slug: 'questions-frequentes', famille: 'blocs', type: 'faq', secteurs: [],
    titre: 'Questions fréquentes',
    description: 'Une section de questions-réponses dépliables, construite sur <details> : utilisable sans JavaScript et au clavier.',
    tags: ['faq', 'accordéon', 'section', 'details'],
    taille: 'ngs-case--wide',
    css: BASE + `:host { display: block; font-family: var(--ngs-font-family, system-ui, sans-serif); color: var(--ngs-color-text, #0b0b0c); }
.faq { width: 100%; max-width: 44rem; }
.faq__titre { margin: 0 0 calc(var(--ngs-density, 1) * 16px); font-size: 1.5rem; line-height: 1.2; letter-spacing: -0.01em; }
.faq__liste { display: grid; gap: calc(var(--ngs-density, 1) * 8px); }
.faq__item {
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93);
  interpolate-size: allow-keywords;
}
.faq__item::details-content { height: 0; overflow: clip; }
.faq__item[open]::details-content { height: auto; }
.faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: calc(var(--ngs-density, 1) * 56px);
  padding: 0 calc(var(--ngs-density, 1) * 16px);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}
.faq__question::-webkit-details-marker { display: none; }
.faq__question svg { flex: none; width: 18px; height: 18px; }
.faq__item[open] .faq__question svg { transform: rotate(180deg); }
.faq__question:focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 2px; border-radius: var(--ngs-radius, 10px); }
.faq__reponse { margin: 0; padding: 0 calc(var(--ngs-density, 1) * 16px) calc(var(--ngs-density, 1) * 16px); color: var(--ngs-color-text-muted, #5f5f66); line-height: 1.55; }
/* Animations : la réponse se déplie (hauteur), descend de 4 px en apparaissant, la flèche pivote. */
@media (prefers-reduced-motion: no-preference) {
  .faq__item::details-content { transition: height var(--ngs-duration, 160ms) ease-out, content-visibility var(--ngs-duration, 160ms) allow-discrete; }
  .faq__question svg { transition: transform var(--ngs-duration, 160ms) ease-out; }
  .faq__item[open] .faq__reponse { animation: ngs-faq-reponse calc(var(--ngs-duration, 160ms) * 1.5) cubic-bezier(.22, 1, .36, 1) both; }
}
@keyframes ngs-faq-reponse { from { opacity: 0; transform: translateY(-4px); } }
/* Désactivables : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation) .faq__item::details-content, :host(.ngs-sans-animation) .faq__question svg { transition: none; }
:host(.ngs-sans-animation) .faq__item[open] .faq__reponse { animation: none; }
:host-context(.ngs-sans-animation) .faq__item::details-content, :host-context(.ngs-sans-animation) .faq__question svg { transition: none; }
:host-context(.ngs-sans-animation) .faq__item[open] .faq__reponse { animation: none; }`,
    tw: {
      ':host': 'block font-ngs text-ngs-text',
      faq: 'w-full max-w-[44rem]',
      faq__titre: 'mt-0 mb-ngs-4 text-2xl leading-tight tracking-tight',
      faq__liste: 'grid gap-ngs-2',
      faq__item: 'group rounded-ngs bg-ngs-surface shadow-[inset_0_0_0_1px_var(--color-ngs-border)] [interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-clip open:details-content:h-auto motion-safe:details-content:transition-[height,content-visibility] motion-safe:details-content:transition-discrete motion-safe:details-content:duration-(--ngs-duration) in-[.ngs-sans-animation]:details-content:transition-none!',
      faq__question: 'flex min-h-ngs-14 cursor-pointer list-none items-center justify-between gap-4 px-ngs-4 font-semibold focus-visible:rounded-ngs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ngs-action [&::-webkit-details-marker]:hidden [&_svg]:size-[18px] [&_svg]:flex-none motion-safe:[&_svg]:transition-transform motion-safe:[&_svg]:duration-(--ngs-duration) group-open:[&_svg]:rotate-180 in-[.ngs-sans-animation]:[&_svg]:transition-none!',
      faq__reponse: 'm-0 px-ngs-4 pb-ngs-4 leading-relaxed text-ngs-text-muted motion-safe:group-open:animate-[ngs-faq-reponse_calc(var(--ngs-duration)*1.5)_cubic-bezier(.22,1,.36,1)_both] in-[.ngs-sans-animation]:animate-none!'
    },
    demo: '<section class="faq" aria-labelledby="faq-titre"><h2 class="faq__titre" id="faq-titre">Questions fréquentes</h2><div class="faq__liste">' +
      faqItems.map(function (q, i) {
        return '<details class="faq__item"' + (i === 0 ? ' open' : '') + '><summary class="faq__question">' + q[0] + SVG.caret + '</summary><p class="faq__reponse">' + q[1] + '</p></details>';
      }).join('') + '</div></section>',
    init: null,
    usage: `<ngs-questions-frequentes
  titre="Questions fréquentes"
  [questions]="questions"
/>`,
    api: [
      { nom: 'titre', type: 'input<string>()', defaut: "'Questions fréquentes'", role: 'Titre de la section (h2).' },
      { nom: 'questions', type: 'input.required<readonly Question[]>()', defaut: '—', role: 'Liste { question, reponse }.' },
      { nom: 'ouverte', type: 'input<number | null>()', defaut: '0', role: 'Question ouverte au départ.' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false : la réponse s’affiche d’un coup (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' }
    ],
    motion: {
      resume: 'La réponse se déplie en douceur et descend de 4 px en apparaissant ; la flèche pivote.',
      moments: ['ouverture'],
      technique: 'transition CSS sur ::details-content (interpolate-size), @keyframes'
    },
    keyframesTailwind: '@keyframes ngs-faq-reponse {\n  from { opacity: 0; transform: translateY(-4px); }\n}\n',
    angular: {
      nom: 'questions-frequentes',
      ts: `import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export interface Question {
  readonly question: string;
  readonly reponse: string;
}

let compteur = 0;

@Component({
  selector: 'ngs-questions-frequentes',
  templateUrl: './questions-frequentes.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsFrequentesComponent {
  readonly titre = input('Questions fréquentes');
  readonly questions = input.required<readonly Question[]>();
  readonly ouverte = input<number | null>(0);
  /** false : la réponse s'affiche sans animation. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-faq-' + compteur++;
}`,
      html: `<section class="faq" [attr.aria-labelledby]="id">
  <h2 class="faq__titre" [id]="id">{{ titre() }}</h2>
  <div class="faq__liste">
    @for (q of questions(); track q.question; let i = $index) {
      <details class="faq__item" [open]="i === ouverte()">
        <summary class="faq__question">
          {{ q.question }}
          ${SVG.caret}
        </summary>
        <p class="faq__reponse">{{ q.reponse }}</p>
      </details>
    }
  </div>
</section>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 9. Bloc : navbar (restaurant)                                       */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'navbar-restaurant', famille: 'blocs', type: 'navbar', secteurs: ['restaurant'],
    titre: 'Barre de navigation',
    description: 'Une navbar qui s’adapte à la largeur de son conteneur (container queries) : liens en ligne, ou menu repliable annoncé.',
    tags: ['navbar', 'navigation', 'header', 'menu', 'restaurant'],
    taille: 'ngs-case--wide',
    css: BASE + `:host { display: block; width: 100%; container-type: inline-size; font-family: var(--ngs-font-family, system-ui, sans-serif); color: var(--ngs-color-text, #0b0b0c); }
.navbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--ngs-density, 1) * 8px) calc(var(--ngs-density, 1) * 24px);
  padding: calc(var(--ngs-density, 1) * 10px) calc(var(--ngs-density, 1) * 16px);
  border-radius: calc(var(--ngs-radius, 10px) * 1.4);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93);
}
.navbar__marque { font-weight: 750; font-size: 1.125rem; letter-spacing: -0.01em; color: inherit; text-decoration: none; }
.navbar__liens { display: flex; gap: calc(var(--ngs-density, 1) * 4px); margin-right: auto; }
.navbar__lien {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 calc(var(--ngs-density, 1) * 10px);
  border-radius: var(--ngs-radius, 10px);
  color: var(--ngs-color-text-muted, #5f5f66);
  font-weight: 550;
  text-decoration: none;
  transition: color var(--ngs-duration, 160ms) ease-out, background-color var(--ngs-duration, 160ms) ease-out;
}
.navbar__lien:hover { color: var(--ngs-color-text, #0b0b0c); background: var(--ngs-color-surface-alt, #f4f4f5); }
.navbar__lien[aria-current="page"] { color: var(--ngs-color-text, #0b0b0c); box-shadow: inset 0 -2px 0 var(--ngs-color-action, #0b0b0c); border-radius: 0; }
.navbar__action {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 calc(var(--ngs-density, 1) * 16px);
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-action, #0b0b0c);
  color: var(--ngs-color-on-action, #ffffff);
  font-weight: 600;
  text-decoration: none;
}
.navbar__menu {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-left: auto;
  border: 0;
  border-radius: var(--ngs-radius, 10px);
  background: var(--ngs-color-surface-alt, #f4f4f5);
  color: inherit;
  cursor: pointer;
}
.navbar__menu svg { width: 22px; height: 22px; }
.navbar__mobile { display: none; flex-basis: 100%; flex-direction: column; gap: 2px; padding-top: calc(var(--ngs-density, 1) * 8px); }
.navbar :is(a, button):focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 2px; }
/* Entrée : la barre descend de 8 px, puis les liens et l'action arrivent en cascade (45 ms d'écart). */
@media (prefers-reduced-motion: no-preference) {
  .navbar { animation: ngs-navbar-entree calc(var(--ngs-duration, 160ms) * 3) cubic-bezier(.22, 1, .36, 1) both; }
  .navbar__liens > .navbar__lien, .navbar__action { animation: ngs-navbar-lien calc(var(--ngs-duration, 160ms) * 3) cubic-bezier(.22, 1, .36, 1) both; }
  .navbar__liens > .navbar__lien:nth-child(1) { animation-delay: 120ms; }
  .navbar__liens > .navbar__lien:nth-child(2) { animation-delay: 165ms; }
  .navbar__liens > .navbar__lien:nth-child(3) { animation-delay: 210ms; }
  .navbar__liens > .navbar__lien:nth-child(n + 4) { animation-delay: 255ms; }
  .navbar__action { animation-delay: 300ms; }
  /* Menu replié : les liens glissent à l'ouverture. */
  .navbar__mobile:not([hidden]) > * { animation: ngs-navbar-lien calc(var(--ngs-duration, 160ms) * 2) cubic-bezier(.22, 1, .36, 1) both; }
}
@keyframes ngs-navbar-entree { from { opacity: 0; transform: translateY(-8px); } }
@keyframes ngs-navbar-lien { from { opacity: 0; transform: translateY(-6px); } }
/* Désactivables : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation) .navbar, :host(.ngs-sans-animation) .navbar * { animation: none; }
:host-context(.ngs-sans-animation) .navbar, :host-context(.ngs-sans-animation) .navbar * { animation: none; }
@container (max-width: 40rem) {
  .navbar__liens, .navbar__action { display: none; }
  .navbar__menu { display: inline-grid; }
  .navbar__mobile:not([hidden]) { display: flex; }
}`,
    tw: {
      ':host': 'block w-full font-ngs text-ngs-text @container',
      navbar: 'flex flex-wrap items-center gap-x-ngs-6 gap-y-ngs-2 rounded-[calc(var(--radius-ngs)*1.4)] bg-ngs-surface px-ngs-4 py-ngs-3 shadow-[inset_0_0_0_1px_var(--color-ngs-border)] [&_:is(a,button)]:focus-visible:outline-2 [&_:is(a,button)]:focus-visible:outline-offset-2 [&_:is(a,button)]:focus-visible:outline-ngs-action motion-safe:animate-[ngs-navbar-entree_calc(var(--ngs-duration)*3)_cubic-bezier(.22,1,.36,1)_both] in-[.ngs-sans-animation]:animate-none! in-[.ngs-sans-animation]:[&_*]:animate-none!',
      navbar__marque: 'text-lg font-bold tracking-tight text-inherit no-underline',
      navbar__liens: 'mr-auto hidden gap-ngs-1 @[40rem]:flex motion-safe:[&>*]:animate-[ngs-navbar-lien_calc(var(--ngs-duration)*3)_cubic-bezier(.22,1,.36,1)_both] [&>*:nth-child(1)]:[animation-delay:120ms] [&>*:nth-child(2)]:[animation-delay:165ms] [&>*:nth-child(3)]:[animation-delay:210ms] [&>*:nth-child(n+4)]:[animation-delay:255ms]',
      navbar__lien: 'inline-flex min-h-11 items-center rounded-ngs px-ngs-3 font-medium text-ngs-text-muted no-underline transition-colors duration-(--ngs-duration) hover:bg-ngs-surface-alt hover:text-ngs-text aria-[current=page]:rounded-none aria-[current=page]:text-ngs-text aria-[current=page]:shadow-[inset_0_-2px_0_var(--color-ngs-action)]',
      navbar__action: 'hidden min-h-11 items-center rounded-ngs bg-ngs-action px-ngs-4 font-semibold text-ngs-on-action no-underline @[40rem]:inline-flex motion-safe:animate-[ngs-navbar-lien_calc(var(--ngs-duration)*3)_cubic-bezier(.22,1,.36,1)_both] motion-safe:[animation-delay:300ms]',
      navbar__menu: 'ml-auto inline-grid size-11 cursor-pointer place-items-center rounded-ngs border-0 bg-ngs-surface-alt text-inherit @[40rem]:hidden [&_svg]:size-[22px]',
      navbar__mobile: 'flex basis-full flex-col gap-0.5 pt-ngs-2 @[40rem]:hidden motion-safe:[&>*]:animate-[ngs-navbar-lien_calc(var(--ngs-duration)*2)_cubic-bezier(.22,1,.36,1)_both]'
    },
    demo: `<header class="navbar"><a class="navbar__marque" href="#">Chez Awa</a><nav class="navbar__liens" aria-label="Navigation principale"><a class="navbar__lien" href="#" aria-current="page">Accueil</a><a class="navbar__lien" href="#">La carte</a><a class="navbar__lien" href="#">Événements</a><a class="navbar__lien" href="#">Contact</a></nav><a class="navbar__action" href="#">Réserver une table</a><button class="navbar__menu" type="button" aria-expanded="false" aria-controls="navbar-mobile" aria-label="Ouvrir le menu">${SVG.liste}</button><nav class="navbar__mobile" id="navbar-mobile" aria-label="Navigation principale" hidden><a class="navbar__lien" href="#" aria-current="page">Accueil</a><a class="navbar__lien" href="#">La carte</a><a class="navbar__lien" href="#">Événements</a><a class="navbar__lien" href="#">Contact</a><a class="navbar__action" href="#" style="display:inline-flex">Réserver une table</a></nav></header>`,
    init: function (root) {
      root.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
      var b = root.querySelector('.navbar__menu');
      var m = root.querySelector('.navbar__mobile');
      b.addEventListener('click', function () {
        var ouvert = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(ouvert));
        b.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
        m.hidden = !ouvert;
      });
    },
    usage: `<ngs-navbar-restaurant
  marque="Chez Awa"
  [liens]="[
    { libelle: 'Accueil', route: '/' },
    { libelle: 'La carte', route: '/carte' },
  ]"
  action="Réserver une table"
  routeAction="/reserver"
/>`,
    api: [
      { nom: 'marque', type: 'input.required<string>()', defaut: '—', role: 'Nom affiché à gauche.' },
      { nom: 'liens', type: 'input.required<readonly LienNav[]>()', defaut: '—', role: 'Liens { libelle, route } (routerLinkActive).' },
      { nom: 'action / routeAction', type: 'input<string>()', defaut: "''", role: 'Bouton d’action principal (optionnel).' },
      { nom: 'menuOuvert', type: 'model<boolean>()', defaut: 'false', role: 'État du menu replié, liable.' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false : la barre et ses liens s’affichent sans entrer (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' }
    ],
    motion: {
      resume: 'À l’affichage, la barre descend de 8 px, puis les liens et l’action arrivent en cascade ; les liens du menu replié glissent à l’ouverture.',
      moments: ['entree', 'ouverture'],
      technique: '@keyframes CSS avec délais en cascade',
      rejouer: { entree: true }
    },
    keyframesTailwind: '@keyframes ngs-navbar-entree {\n  from { opacity: 0; transform: translateY(-8px); }\n}\n@keyframes ngs-navbar-lien {\n  from { opacity: 0; transform: translateY(-6px); }\n}\n',
    angular: {
      nom: 'navbar-restaurant',
      ts: `import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface LienNav {
  readonly libelle: string;
  readonly route: string;
}

let compteur = 0;

@Component({
  selector: 'ngs-navbar-restaurant',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar-restaurant.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarRestaurantComponent {
  readonly marque = input.required<string>();
  readonly liens = input.required<readonly LienNav[]>();
  readonly action = input('');
  readonly routeAction = input('');
  readonly menuOuvert = model(false);
  /** false : la barre s'affiche sans entrer. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly idMenu = 'ngs-navbar-menu-' + compteur++;
  protected readonly libelleMenu = computed(() => (this.menuOuvert() ? 'Fermer le menu' : 'Ouvrir le menu'));

  protected basculerMenu(): void {
    this.menuOuvert.update((o) => !o);
  }
}`,
      html: `<header class="navbar">
  <a class="navbar__marque" routerLink="/">{{ marque() }}</a>
  <nav class="navbar__liens" aria-label="Navigation principale">
    @for (lien of liens(); track lien.route) {
      <a class="navbar__lien" [routerLink]="lien.route" routerLinkActive ariaCurrentWhenActive="page">{{ lien.libelle }}</a>
    }
  </nav>
  @if (action()) {
    <a class="navbar__action" [routerLink]="routeAction()">{{ action() }}</a>
  }
  <button
    class="navbar__menu"
    type="button"
    [attr.aria-expanded]="menuOuvert()"
    [attr.aria-controls]="idMenu"
    [attr.aria-label]="libelleMenu()"
    (click)="basculerMenu()"
  >
    ${SVG.liste}
  </button>
  <nav class="navbar__mobile" [id]="idMenu" aria-label="Navigation principale" [hidden]="!menuOuvert()">
    @for (lien of liens(); track lien.route) {
      <a class="navbar__lien" [routerLink]="lien.route" routerLinkActive ariaCurrentWhenActive="page" (click)="menuOuvert.set(false)">
        {{ lien.libelle }}
      </a>
    }
  </nav>
</header>`
    }
  });

  /* ------------------------------------------------------------------ */
  /* 10. Bloc : hero (restaurant)                                        */
  /* ------------------------------------------------------------------ */
  r.push({
    slug: 'hero-restaurant', famille: 'blocs', type: 'hero', secteurs: ['restaurant'],
    titre: 'Hero avec photo',
    description: 'Un hero qui pose une vraie photo et un panneau de texte lisible, sans voile sur l’image. Il passe en colonne dans un conteneur étroit.',
    tags: ['hero', 'photo', 'accueil', 'restaurant', 'cta'],
    taille: 'ngs-case--wide ngs-case--tall',
    css: BASE + `:host { display: block; width: 100%; container-type: inline-size; font-family: var(--ngs-font-family, system-ui, sans-serif); color: var(--ngs-color-text, #0b0b0c); }
.hero {
  position: relative;
  display: grid;
  overflow: hidden;
  border-radius: calc(var(--ngs-radius, 10px) * 1.6);
  background: var(--ngs-color-surface, #ffffff);
  box-shadow: inset 0 0 0 1px var(--ngs-color-border, #8a8a93);
}
.hero__cadre { overflow: hidden; aspect-ratio: 16 / 10; }
.hero__image { display: block; width: 100%; height: 100%; object-fit: cover; }
.hero__contenu { display: grid; gap: calc(var(--ngs-density, 1) * 12px); padding: calc(var(--ngs-density, 1) * 20px); }
.hero__titre { margin: 0; font-size: clamp(1.5rem, 1rem + 4cqi, 2.5rem); line-height: 1.08; letter-spacing: -0.02em; text-wrap: balance; }
.hero__texte { margin: 0; color: var(--ngs-color-text-muted, #5f5f66); font-size: 1rem; line-height: 1.5; }
.hero__actions { display: flex; flex-wrap: wrap; gap: calc(var(--ngs-density, 1) * 8px); }
.hero__action, .hero__lien {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 calc(var(--ngs-density, 1) * 16px);
  border-radius: var(--ngs-radius, 10px);
  font-weight: 600;
  text-decoration: none;
}
.hero__action { background: var(--ngs-color-action, #0b0b0c); color: var(--ngs-color-on-action, #ffffff); }
.hero__lien { color: var(--ngs-color-text, #0b0b0c); box-shadow: inset 0 0 0 1.5px var(--ngs-color-text, #0b0b0c); }
.hero :is(a):focus-visible { outline: 2px solid var(--ngs-color-action, #0b0b0c); outline-offset: 2px; }
@container (min-width: 38rem) {
  .hero { grid-template-columns: 1.15fr 1fr; align-items: stretch; }
  .hero__cadre { order: 2; aspect-ratio: auto; min-height: 22rem; }
  .hero__contenu { align-content: center; padding: calc(var(--ngs-density, 1) * 32px); }
}
/* Entrée (au premier affichage) : la photo se dévoile et se pose, puis titre, texte et boutons montent en cascade.
   Sortie : classe hero-sortie posée sur l'hôte par animate.leave="hero-sortie" dans le template parent. */
@media (prefers-reduced-motion: no-preference) {
  .hero__image { animation: ngs-hero-photo calc(var(--ngs-duration, 160ms) * 6) cubic-bezier(.22, 1, .36, 1) both; }
  .hero__titre, .hero__texte, .hero__actions { animation: ngs-hero-texte calc(var(--ngs-duration, 160ms) * 4) cubic-bezier(.22, 1, .36, 1) both; }
  .hero__titre { animation-delay: calc(var(--ngs-duration, 160ms) * 1); }
  .hero__texte { animation-delay: calc(var(--ngs-duration, 160ms) * 1.6); }
  .hero__actions { animation-delay: calc(var(--ngs-duration, 160ms) * 2.2); }
  :host(.hero-sortie) { animation: ngs-hero-sortie calc(var(--ngs-duration, 160ms) * 2) cubic-bezier(.65, 0, .35, 1) both; }
}
@keyframes ngs-hero-photo { from { opacity: 0; transform: scale(1.08); clip-path: inset(0 0 0 30%); } to { opacity: 1; transform: none; clip-path: inset(0); } }
@keyframes ngs-hero-texte { from { opacity: 0; transform: translateY(16px); } }
@keyframes ngs-hero-sortie { to { opacity: 0; transform: translateY(-12px); } }
/* Désactivables : input animations (classe sur l'hôte) ou classe .ngs-sans-animation sur un parent. */
:host(.ngs-sans-animation), :host(.ngs-sans-animation) .hero * { animation: none; }
:host-context(.ngs-sans-animation) .hero * { animation: none; }`,
    tw: {
      ':host': 'block w-full font-ngs text-ngs-text @container',
      hero: 'relative grid overflow-hidden rounded-[calc(var(--radius-ngs)*1.6)] bg-ngs-surface shadow-[inset_0_0_0_1px_var(--color-ngs-border)] @[38rem]:grid-cols-[1.15fr_1fr] @[38rem]:items-stretch [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-ngs-action',
      hero__cadre: 'aspect-[16/10] overflow-hidden @[38rem]:order-2 @[38rem]:aspect-auto @[38rem]:min-h-[22rem]',
      hero__image: 'block size-full object-cover motion-safe:animate-[ngs-hero-photo_calc(var(--ngs-duration)*6)_cubic-bezier(.22,1,.36,1)_both] in-[.ngs-sans-animation]:animate-none!',
      hero__contenu: 'grid gap-ngs-3 p-ngs-5 @[38rem]:content-center @[38rem]:p-ngs-8',
      hero__titre: 'm-0 text-[clamp(1.5rem,1rem+4cqi,2.5rem)] leading-[1.08] tracking-tight text-balance motion-safe:animate-[ngs-hero-texte_calc(var(--ngs-duration)*4)_cubic-bezier(.22,1,.36,1)_both] motion-safe:[animation-delay:var(--ngs-duration)] in-[.ngs-sans-animation]:animate-none!',
      hero__texte: 'm-0 text-base leading-normal text-ngs-text-muted motion-safe:animate-[ngs-hero-texte_calc(var(--ngs-duration)*4)_cubic-bezier(.22,1,.36,1)_both] motion-safe:[animation-delay:calc(var(--ngs-duration)*1.6)] in-[.ngs-sans-animation]:animate-none!',
      hero__actions: 'flex flex-wrap gap-ngs-2 motion-safe:animate-[ngs-hero-texte_calc(var(--ngs-duration)*4)_cubic-bezier(.22,1,.36,1)_both] motion-safe:[animation-delay:calc(var(--ngs-duration)*2.2)] in-[.ngs-sans-animation]:animate-none!',
      'hero-sortie': 'motion-safe:animate-[ngs-hero-sortie_calc(var(--ngs-duration)*2)_cubic-bezier(.65,0,.35,1)_both] in-[.ngs-sans-animation]:animate-none!',
      hero__action: 'inline-flex min-h-11 items-center rounded-ngs bg-ngs-action px-ngs-4 font-semibold text-ngs-on-action no-underline',
      hero__lien: 'inline-flex min-h-11 items-center rounded-ngs px-ngs-4 font-semibold text-ngs-text no-underline shadow-[inset_0_0_0_1.5px_var(--color-ngs-text)]'
    },
    demo: `<section class="hero" aria-labelledby="hero-r-titre"><div class="hero__cadre"><img class="hero__image" src="${IMG}yassa-1024.webp" srcset="${IMG}yassa-640.webp 640w, ${IMG}yassa-1024.webp 1024w, ${IMG}yassa-1600.webp 1600w" sizes="(min-width: 1024px) 40vw, 90vw" width="1024" height="683" alt="Poulet yassa aux oignons, riz blanc, alloco et piments, servis en poêlons sur une table." fetchpriority="high" decoding="async"></div><div class="hero__contenu"><h2 class="hero__titre" id="hero-r-titre">Le yassa du vendredi, comme à la maison</h2><p class="hero__texte">Cuisine sénégalaise de saison, servie midi et soir à Dakar.</p><div class="hero__actions"><a class="hero__action" href="#">Réserver une table</a><a class="hero__lien" href="#">Voir la carte</a></div></div></section>`,
    init: function (root) { root.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); }); },
    usage: `<!-- animate.leave (facultatif) : le hero s'efface quand il est retiré de la page -->
<ngs-hero-restaurant
  animate.leave="hero-sortie"
  titre="Le yassa du vendredi, comme à la maison"
  texte="Cuisine sénégalaise de saison, servie midi et soir à Dakar."
  image="/images/yassa.webp"
  alt="Poulet yassa aux oignons et riz blanc servis en poêlons."
  action="Réserver une table"
  routeAction="/reserver"
  lien="Voir la carte"
  routeLien="/carte"
/>`,
    api: [
      { nom: 'titre / texte', type: 'input.required<string>()', defaut: '—', role: 'Titre (h2 par défaut) et phrase.' },
      { nom: 'niveauTitre', type: 'input<1 | 2>()', defaut: '2', role: 'h1 si le hero ouvre la page.' },
      { nom: 'image / alt', type: 'input.required<string>()', defaut: '—', role: 'Photo (NgOptimizedImage, priority).' },
      { nom: 'action / routeAction / lien / routeLien', type: 'input<string>()', defaut: "''", role: 'Action principale et lien secondaire.' },
      { nom: 'animations', type: 'input<boolean>()', defaut: 'true', role: 'false : ni entrée ni sortie (aussi : classe .ngs-sans-animation sur un parent, ou mouvement réduit du système).' },
      { nom: 'animate.leave="hero-sortie"', type: 'dans le template parent', defaut: '—', role: 'Sortie quand le hero est retiré (@if, changement de vue) : il s’efface en montant de 12 px.' }
    ],
    motion: {
      resume: 'À l’affichage, la photo se dévoile et se pose, puis le titre, le texte et les boutons montent en cascade. Retiré de la page, le hero s’efface en montant.',
      moments: ['entree', 'sortie'],
      technique: '@keyframes CSS en cascade ; sortie par animate.leave d’Angular (classe hero-sortie sur l’hôte)',
      rejouer: { entree: true, sortie: 'hero-sortie' }
    },
    keyframesTailwind: '@keyframes ngs-hero-photo {\n  from { opacity: 0; transform: scale(1.08); clip-path: inset(0 0 0 30%); }\n  to { opacity: 1; transform: none; clip-path: inset(0); }\n}\n@keyframes ngs-hero-texte {\n  from { opacity: 0; transform: translateY(16px); }\n}\n@keyframes ngs-hero-sortie {\n  to { opacity: 0; transform: translateY(-12px); }\n}\n/* Sortie : animate.leave=\"hero-sortie\" dans le template parent pose cette classe sur l’hôte. */\n@media (prefers-reduced-motion: no-preference) {\n  :host(.hero-sortie) { animation: ngs-hero-sortie calc(var(--ngs-duration) * 2) cubic-bezier(.65, 0, .35, 1) both; }\n}\n:host(.ngs-sans-animation.hero-sortie) { animation: none; }\n',
    angular: {
      nom: 'hero-restaurant',
      ts: `import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

let compteur = 0;

@Component({
  selector: 'ngs-hero-restaurant',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './hero-restaurant.component.html',
  /*STYLE*/
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroRestaurantComponent {
  readonly titre = input.required<string>();
  readonly texte = input.required<string>();
  readonly niveauTitre = input<1 | 2>(2);
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  readonly action = input('');
  readonly routeAction = input('');
  readonly lien = input('');
  readonly routeLien = input('');
  /** false : ni entrée ni sortie animées. */
  readonly animations = input(true, { transform: booleanAttribute });

  protected readonly id = 'ngs-hero-' + compteur++;
}`,
      html: `<section class="hero" [attr.aria-labelledby]="id">
  <div class="hero__cadre">
    <img class="hero__image" [ngSrc]="image()" [alt]="alt()" fill priority sizes="(min-width: 1024px) 40vw, 90vw" />
  </div>
  <div class="hero__contenu">
    @if (niveauTitre() === 1) {
      <h1 class="hero__titre" [id]="id">{{ titre() }}</h1>
    } @else {
      <h2 class="hero__titre" [id]="id">{{ titre() }}</h2>
    }
    <p class="hero__texte">{{ texte() }}</p>
    <div class="hero__actions">
      @if (action()) {
        <a class="hero__action" [routerLink]="routeAction()">{{ action() }}</a>
      }
      @if (lien()) {
        <a class="hero__lien" [routerLink]="routeLien()">{{ lien() }}</a>
      }
    </div>
  </div>
</section>`
    }
  });

  /* Valeurs communes */
  r.forEach(function (x) {
    x.reglable = true;
    x.provisoire = true;
    x.angularVersion = '22';
    x.dependances = [];
    x.taille = x.taille || '';
    x.motion = x.motion || null;
    x.ajout = '2026-11-26';
    // Modèle de l'ADR 0004 : catégorie au singulier ; « famille » = segment de route au pluriel.
    x.categorie = { composants: 'composant', blocs: 'bloc', templates: 'template' }[x.famille];
    x.statut = 'provisoire';
    x.contratTokens = 1;
    x.variantes = ['tailwind', 'css'];
    x.dependancesReservees = { npm: [], ressources: [] };
  });

  /* ------------------------------------------------------------------ */
  /* Designs : thèmes de tokens (valeurs lues dans contrat-tokens.css)   */
  /* ------------------------------------------------------------------ */
  [
    ['planche', 'Planche', 'Le design par défaut : encre noire, rayons moyens, police du système. Sobre, il laisse le contenu parler.'],
    ['fleuve', 'Fleuve', 'Vert d’eau profond, angles très doux, espacements généreux et police arrondie du système.'],
    ['laterite', 'Latérite', 'Rouge de terre cuite, angles presque droits, densité serrée et police à empattements.']
  ].forEach(function (d) {
    r.push({
      slug: d[0], famille: 'designs', categorie: 'design', type: null, secteurs: [], statut: 'provisoire', contratTokens: 1,
      titre: 'Design ' + d[1], nomDesign: d[1], description: d[2],
      tags: ['design', 'tokens', 'couleurs', 'mode sombre', 'thème visuel'],
      reglable: true, provisoire: true, angularVersion: '22', dependances: [], taille: '', ajout: '2026-11-26',
      design: d[0], motion: null,
      composition: ['interrupteur', 'champ-email', 'curseur', 'notifications'],
      usage: `/* styles.css de votre application */
@import "./tokens.css";`,
      api: [], angular: null
    });
  });

  NGS.registre = r;
  NGS.trouver = function (slug) {
    for (var i = 0; i < r.length; i++) if (r[i].slug === slug) return r[i];
    return null;
  };

  /* ------------------------------------------------------------------ */
  /* Taxonomie : famille → type, et secteur (thème métier)               */
  /* Les libellés sont dans textes.fr.js (famille.*, type.*, secteur.*). */
  /* ------------------------------------------------------------------ */
  NGS.familles = [
    { id: 'composants', icone: 'squares-four' },
    { id: 'blocs', icone: 'rows' },
    { id: 'templates', icone: 'browser' },
    { id: 'designs', icone: 'palette' }
  ];
  NGS.categories = NGS.familles; // compatibilité
  // Vocabulaire contrôlé de l'ADR 0004 (registry/taxonomie/). Libellés : textes.fr.js (type.*, secteur.*).
  NGS.types = [];
  [
    ['composants', 'bouton champ selection case-a-cocher interrupteur badge avatar carte modale tiroir menu-deroulant onglets accordeon infobulle notification alerte tableau pagination fil-d-ariane calendrier chargement etapes'],
    ['blocs', 'navbar footer hero fonctionnalites pricing temoignages faq appel-a-l-action formulaire equipe statistiques galerie logos newsletter section-contenu'],
    ['templates', 'landing vitrine tableau-de-bord authentification blog portfolio boutique page-erreur']
  ].forEach(function (g) { g[1].split(' ').forEach(function (id) { NGS.types.push({ id: id, famille: g[0] }); }); });
  NGS.secteurs = [
    { id: 'voyage', icone: 'airplane-tilt' }, { id: 'restaurant', icone: 'fork-knife' }, { id: 'transport', icone: 'bus' },
    { id: 'sante', icone: 'first-aid' }, { id: 'immobilier', icone: 'house-line' }, { id: 'education', icone: 'graduation-cap' },
    { id: 'commerce', icone: 'storefront' }, { id: 'finance', icone: 'bank' }, { id: 'evenementiel', icone: 'calendar-star' },
    { id: 'beaute-bien-etre', icone: 'flower-lotus' }, { id: 'sport', icone: 'soccer-ball' }, { id: 'saas', icone: 'cloud' },
    { id: 'associatif', icone: 'hand-heart' }, { id: 'creatif', icone: 'paint-brush' }
  ];
})();
