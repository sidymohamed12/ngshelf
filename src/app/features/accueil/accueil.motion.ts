import { ContexteMouvement, Demontage } from '@core/motion/mouvement-page.service';
import type { SplitText } from 'gsap/SplitText';

/**
 * Mise en scène de l'accueil (mode « Convaincre », motion niveau 1). Chaque fonction correspond à une ligne du
 * tableau de motion de design/HANDOFF.md §8.2 (numéro dans le commentaire). Règles du design (§8.5) :
 * `fromTo` avec état final explicite puis `clearProps` ; jamais de `width`, `height`, `top`, `left` ; les états
 * cachés ne sont posés qu'ici (le HTML prérendu est complet) ; `transform` est réservé à GSAP.
 */

const NETTOYER = 'transform,opacity,visibility';
const MARGE_TITRE = 'top 85%';
/** Amplitude du bouton magnétique : ±5 px en x, ±4 px en y (maquette). */
const AMPLITUDE_BOUTON_X = 10;
const AMPLITUDE_BOUTON_Y = 8;
/** Moment de la timeline du tracé où chaque étape apparaît (de 0 à 1). */
const POSITIONS_NOEUDS = [0, 0.33, 0.66, 0.98] as const;
const TITRES_SECTIONS = [
  '#familles-titre',
  '#gestes-titre',
  '#contrat-titre',
  '#contribuer-titre',
] as const;

type Nettoyages = Demontage[];

/** Rayon des panneaux (`--radius-panel`), lu dans le CSS pour les `clip-path` arrondis. */
function rayonPanneau(hote: HTMLElement): string {
  const rayon = getComputedStyle(hote).getPropertyValue('--radius-panel').trim();
  return `round ${rayon || '20px'}`;
}

function clip(haut: number, rayon: string): string {
  return `inset(0 0 ${haut}% 0 ${rayon})`;
}

/** 2. Hero : le titre ligne par ligne, le texte en cascade, la vitrine qui s'ouvre, les pièces, les étiquettes. */
function animerHero({ gsap, SplitText, hote }: ContexteMouvement, nettoyages: Nettoyages): void {
  const titre = hote.querySelector<HTMLElement>('#hero-titre');
  if (!titre) return;
  const rayon = rayonPanneau(hote);
  const split = SplitText.create(titre, { type: 'lines', mask: 'lines', linesClass: 'line' });
  nettoyages.push(() => split.revert());
  const texte = hote.querySelectorAll('[data-hero-texte] > :not(h1)');
  const pieces = hote.querySelectorAll('[data-vitrine] [data-piece]');
  const etiquettes = hote.querySelectorAll('[data-vitrine] .ngs-etiquette');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(split.lines, { yPercent: 110, duration: 1, stagger: 0.09 })
    .fromTo(
      texte,
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, clearProps: NETTOYER },
      0.3,
    )
    .fromTo(
      '[data-vitrine-cadre]',
      { clipPath: clip(100, rayon), scale: 0.97 },
      { clipPath: clip(0, rayon), scale: 1, duration: 1.1, clearProps: 'clipPath,transform' },
      0.25,
    )
    .fromTo(
      pieces,
      { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, clearProps: NETTOYER },
      0.55,
    )
    .fromTo(
      '.ngs-vitrine__flottant--cal',
      { y: 60, rotate: -3, autoAlpha: 0 },
      { y: 0, rotate: 0, autoAlpha: 1, duration: 1, clearProps: NETTOYER },
      0.85,
    )
    .fromTo(
      '.ngs-vitrine__flottant--toast',
      { y: -24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, clearProps: NETTOYER },
      1.05,
    )
    .fromTo(
      etiquettes,
      { scale: 0.6, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.08, clearProps: NETTOYER },
      1.25,
    );
}

/** 4 et 8. Pointeur fin, grand écran : profondeur de la vitrine et bouton magnétique (deux effets au plus). */
function animerPointeur(
  { gsap, hote, large, pointeurFin }: ContexteMouvement,
  nettoyages: Nettoyages,
): void {
  if (!pointeurFin) return;
  const vitrine = hote.querySelector<HTMLElement>('[data-vitrine]');
  if (large && vitrine) {
    const suiveurs = Array.from(hote.querySelectorAll<HTMLElement>('[data-flottant]')).map(
      (el) => ({
        p: Number(el.dataset['profondeur'] ?? 10),
        x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
      }),
    );
    const bouger = (e: PointerEvent): void => {
      const r = vitrine.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      for (const s of suiveurs) {
        s.x(dx * s.p);
        s.y(dy * s.p);
      }
    };
    const quitter = (): void => {
      for (const s of suiveurs) {
        s.x(0);
        s.y(0);
      }
    };
    vitrine.addEventListener('pointermove', bouger);
    vitrine.addEventListener('pointerleave', quitter);
    nettoyages.push(() => {
      vitrine.removeEventListener('pointermove', bouger);
      vitrine.removeEventListener('pointerleave', quitter);
    });
  }
  const cta = hote.querySelector<HTMLElement>('[data-magnet]');
  if (!cta) return;
  const qx = gsap.quickTo(cta, 'x', { duration: 0.35, ease: 'power3.out' });
  const qy = gsap.quickTo(cta, 'y', { duration: 0.35, ease: 'power3.out' });
  const bougerCta = (e: PointerEvent): void => {
    const r = cta.getBoundingClientRect();
    qx(((e.clientX - r.left) / r.width - 0.5) * AMPLITUDE_BOUTON_X);
    qy(((e.clientY - r.top) / r.height - 0.5) * AMPLITUDE_BOUTON_Y);
  };
  const reposer = (): void => {
    qx(0);
    qy(0);
  };
  cta.addEventListener('pointermove', bougerCta);
  cta.addEventListener('pointerleave', reposer);
  nettoyages.push(() => {
    cta.removeEventListener('pointermove', bougerCta);
    cta.removeEventListener('pointerleave', reposer);
  });
}

/** 3. Planche : les cases se posent rangée par rangée à l'entrée dans l'écran (une fois). */
function animerPlanche({ gsap, ScrollTrigger, hote }: ContexteMouvement): void {
  const cases = hote.querySelectorAll('.accueil-planche .ngs-case');
  if (cases.length === 0) return;
  gsap.set(cases, { y: 36, scale: 0.96, autoAlpha: 0 });
  ScrollTrigger.batch(cases, {
    start: 'top 92%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { y: 36, scale: 0.96, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.8,
          ease: 'expo.out',
          stagger: 0.06,
          overwrite: true,
          clearProps: NETTOYER,
        },
      ),
  });
}

/** 10. Quatre familles : épinglée et défilement horizontal (≥ 1024 px), sinon empilées en cascade. */
function animerFamilles(
  { gsap, ScrollTrigger, hote, large }: ContexteMouvement,
  nettoyages: Nettoyages,
): void {
  const section = hote.querySelector<HTMLElement>('[data-familles]');
  const piste = section?.querySelector<HTMLElement>('[data-piste]');
  if (!section || !piste) return;
  const familles = piste.querySelectorAll<HTMLElement>('.famille');
  if (!large) {
    gsap.set(familles, { y: 32, autoAlpha: 0 });
    ScrollTrigger.batch(familles, {
      start: 'top 85%',
      once: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { y: 32, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            stagger: 0.08,
            duration: 0.8,
            ease: 'expo.out',
            clearProps: NETTOYER,
          },
        ),
    });
    return;
  }
  section.classList.add('familles--pin');
  nettoyages.push(() => section.classList.remove('familles--pin'));
  const distance = (): number => piste.scrollWidth - document.documentElement.clientWidth;
  const deplacement = gsap.to(piste, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  for (const famille of familles) {
    const nom = famille.querySelector('.famille__nom');
    if (!nom) continue;
    // Chivo n'a pas d'axe de largeur : la graisse passe de 460 à 800 et l'approche se resserre.
    gsap.fromTo(
      nom,
      { '--wght': 460 },
      {
        '--wght': 800,
        ease: 'none',
        scrollTrigger: {
          trigger: famille,
          containerAnimation: deplacement,
          start: 'left 85%',
          end: 'center 50%',
          scrub: true,
        },
      },
    );
  }
}

/** 11. Deux gestes : la démonstration collante change de vue avec la rangée active ; empilée sur mobile. */
function animerGestes(
  { gsap, ScrollTrigger, hote, large }: ContexteMouvement,
  nettoyages: Nettoyages,
): void {
  const rangees = Array.from(hote.querySelectorAll<HTMLElement>('[data-gestes] [data-vue]'));
  const vues = Array.from(hote.querySelectorAll<HTMLElement>('[data-vue-panneau]'));
  const demo = hote.querySelector<HTMLElement>('[data-gestes-demo]');
  if (rangees.length === 0 || vues.length === 0) return;
  const rayon = rayonPanneau(hote);
  nettoyages.push(() => {
    for (const v of vues) v.hidden = false;
    for (const r of rangees) r.classList.remove('is-actif');
    demo?.classList.remove('gestes__demo--empile');
  });
  if (!large) {
    for (const r of rangees) r.classList.add('is-actif');
    for (const v of vues) {
      gsap.fromTo(
        v,
        { clipPath: clip(100, rayon) },
        {
          clipPath: clip(0, rayon),
          duration: 0.8,
          ease: 'expo.out',
          clearProps: 'clipPath',
          scrollTrigger: { trigger: v, start: 'top 85%', once: true },
        },
      );
    }
    return;
  }
  demo?.classList.add('gestes__demo--empile');
  const montrer = (nom: string): void => {
    for (const v of vues) {
      const actif = v.dataset['vuePanneau'] === nom;
      if (actif && v.hidden) {
        v.hidden = false;
        gsap.fromTo(
          v,
          { clipPath: clip(100, rayon) },
          { clipPath: clip(0, rayon), duration: 0.7, ease: 'expo.out', clearProps: 'clipPath' },
        );
        if (nom === 'telecharger') {
          gsap.fromTo(
            v.querySelectorAll('.zip-liste li'),
            { x: -12, autoAlpha: 0 },
            {
              x: 0,
              autoAlpha: 1,
              stagger: 0.05,
              duration: 0.45,
              delay: 0.15,
              clearProps: NETTOYER,
            },
          );
        }
      } else if (!actif) v.hidden = true;
    }
    for (const r of rangees) r.classList.toggle('is-actif', r.dataset['vue'] === nom);
  };
  for (const rangee of rangees) {
    ScrollTrigger.create({
      trigger: rangee,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (s) => {
        if (s.isActive) montrer(rangee.dataset['vue'] ?? '');
      },
    });
  }
  montrer('copier');
}

/** 13. Titres de section : les mots montent depuis un masque (titres courts, une fois). */
function animerTitres({ gsap, SplitText, hote }: ContexteMouvement, nettoyages: Nettoyages): void {
  for (const selecteur of TITRES_SECTIONS) {
    const titre = hote.querySelector<HTMLElement>(selecteur);
    if (!titre) continue;
    const split: SplitText = SplitText.create(titre, {
      type: 'words',
      mask: 'words',
      wordsClass: 'word',
    });
    nettoyages.push(() => split.revert());
    gsap.fromTo(
      split.words,
      { yPercent: 105 },
      {
        yPercent: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'expo.out',
        scrollTrigger: { trigger: titre, start: MARGE_TITRE, once: true },
      },
    );
  }
}

/** 14. Contribuer : le parcours se dessine au défilement, les étapes apparaissent. */
function animerContribuer({ gsap, hote }: ContexteMouvement): void {
  const chemin = hote.querySelector<SVGPathElement>('[data-trace-chemin]');
  const noeuds = hote.querySelectorAll('[data-trace-noeud]');
  if (!chemin || noeuds.length === 0) return;
  const longueur = chemin.getTotalLength();
  gsap.set(chemin, { strokeDasharray: longueur, strokeDashoffset: longueur });
  gsap.set(noeuds, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '[data-trace]', start: 'top 85%', end: 'bottom 80%', scrub: 0.8 },
  });
  tl.to(chemin, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
  POSITIONS_NOEUDS.forEach((position, i) => {
    tl.to(
      noeuds[i] ?? [],
      { autoAlpha: 1, scale: 1, duration: 0.08, ease: 'power2.out' },
      position,
    );
  });
}

/** Monte toute la page. Le démontage défait ce que GSAP ne défait pas seul (SplitText, classes, écouteurs). */
export function monterAccueil(contexte: ContexteMouvement): Demontage {
  const nettoyages: Nettoyages = [];
  animerHero(contexte, nettoyages);
  animerPointeur(contexte, nettoyages);
  animerPlanche(contexte);
  animerFamilles(contexte, nettoyages);
  animerGestes(contexte, nettoyages);
  animerTitres(contexte, nettoyages);
  animerContribuer(contexte);
  return () => {
    for (const nettoyer of nettoyages.reverse()) nettoyer();
  };
}
