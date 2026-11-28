import { ContexteMouvement, Demontage } from '@core/motion/mouvement-page.service';

/**
 * Mise en scène de « À propos » (mode « Convaincre », niveau 1). Chaque fonction porte le numéro de la ligne du
 * tableau de motion (design/HANDOFF.md §8.2). Deux moments épinglés, séparés par « Pourquoi » : « Copier,
 * Régler, Livrer » (220 %) puis « Pour qui » (160 %), tous deux à partir de 1024 px ; sur mobile, rien
 * d'épinglé, les séquences se jouent une fois à l'entrée. Mêmes règles que l'accueil : `fromTo` + `clearProps`,
 * états cachés posés ici seulement, jamais d'animation de dimensions.
 */

const NETTOYER = 'transform,opacity,visibility';
const FIN = 'inset(0% 0% 0% 0%';
const DEPART_HAUT = 'inset(100% 0% 0% 0%';
const DEPART_BAS = 'inset(0% 0% 100% 0%';
const PIN_GESTES = '+=220%';
const PIN_POUR_QUI = '+=160%';
const POINTS_COMMENT = 4;
const DESIGNS_GESTES = 3;
const NOMBRE_ELEVE = 3;

/** Ce que la mise en scène demande à la page de changer (état Angular, pas du DOM). */
export interface RappelsAPropos {
  readonly designGestes: (index: number) => void;
  readonly pointComment: (index: number) => void;
}

type Nettoyages = Demontage[];

function rayon(hote: HTMLElement, nom: string, repli: string): string {
  return getComputedStyle(hote).getPropertyValue(nom).trim() || repli;
}

const forme = (debut: string, rayonCss: string): string => `${debut} round ${rayonCss})`;

/** 24. Hero : mots qui basculent, cinq pièces qui arrivent de loin et s'assemblent, trois faits, étiquettes. */
function animerHero(c: ContexteMouvement, nettoyages: Nettoyages): void {
  const { gsap, SplitText, hote, large } = c;
  const titre = hote.querySelector<HTMLElement>('#apropos-titre');
  if (!titre) return;
  const split = SplitText.create(titre, { type: 'words', mask: 'words', wordsClass: 'word' });
  nettoyages.push(() => split.revert());
  const pieces = gsap.utils.toArray<HTMLElement>('[data-ap-piece]', hote);
  const faits = gsap.utils.toArray<HTMLElement>('[data-ap-fait]', hote);
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(split.words, {
    yPercent: 115,
    rotate: 8,
    transformOrigin: '0% 100%',
    duration: 1,
    stagger: 0.06,
  }).fromTo(
    '[data-ap-texte] > :not(h1)',
    { y: 16, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, clearProps: NETTOYER },
    0.35,
  );
  pieces.forEach((piece, i) => {
    const [dx = 0, dy = 0] = (piece.dataset['depart'] ?? '0,0').split(',').map(Number);
    const echelle = large ? 1 : 0.25;
    tl.fromTo(
      piece,
      {
        x: dx * echelle,
        y: dy * echelle,
        rotation: (i % 2 ? 1 : -1) * 22,
        scale: 0.7,
        autoAlpha: 0,
      },
      {
        x: 0,
        y: 0,
        rotation: large ? Number(piece.dataset['rotation'] ?? 0) : 0,
        scale: 1,
        autoAlpha: 1,
        duration: 1.3,
        clearProps: 'opacity,visibility',
      },
      0.15 + i * 0.09,
    );
  });
  tl.fromTo(
    faits,
    { scale: 0.4, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.1, clearProps: 'opacity,visibility' },
    1.1,
  ).fromTo(
    '[data-ap-piece] .ngs-etiquette',
    { scale: 0.6, autoAlpha: 0 },
    { scale: 1, autoAlpha: 1, duration: 0.45, stagger: 0.06, clearProps: NETTOYER },
    1.25,
  );
}

/** 25. Pointeur fin, grand écran : les pièces flottent selon leur profondeur ; au défilement elles se démontent. */
function animerApesanteur(c: ContexteMouvement, nettoyages: Nettoyages): void {
  const { gsap, hote, large, pointeurFin } = c;
  if (!large) return;
  const flottants = gsap.utils.toArray<HTMLElement>('[data-ap-piece], [data-ap-fait]', hote);
  const zone = hote.querySelector<HTMLElement>('[data-ap-apesanteur]');
  const hero = hote.querySelector<HTMLElement>('.ap-hero');
  if (pointeurFin && zone && hero) {
    const suiveurs = flottants.map((el) => ({
      p: Number(el.dataset['profondeur'] ?? 10),
      x: gsap.quickTo(el, 'xPercent', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'yPercent', { duration: 0.9, ease: 'power3.out' }),
    }));
    const bouger = (e: PointerEvent): void => {
      const r = zone.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      for (const s of suiveurs) {
        s.x(dx * s.p * 0.6);
        s.y(dy * s.p * 0.6);
      }
    };
    const quitter = (): void => {
      for (const s of suiveurs) {
        s.x(0);
        s.y(0);
      }
    };
    hero.addEventListener('pointermove', bouger);
    hero.addEventListener('pointerleave', quitter);
    nettoyages.push(() => {
      hero.removeEventListener('pointermove', bouger);
      hero.removeEventListener('pointerleave', quitter);
    });
  }
  flottants.forEach((el, i) => {
    const p = Number(el.dataset['profondeur'] ?? 10);
    gsap.to(el, {
      y: -p * 9,
      rotation: `+=${(i % 2 ? 1 : -1) * p * 0.5}`,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: '.ap-hero', start: 'top top', end: 'bottom top', scrub: 0.7 },
    });
  });
}

/** 26. Chiffres : tuiles révélées, compteurs, carrés, jetons, pastilles, bascule, « Créer un compte » rayé. */
function animerChiffres(
  { gsap, ScrollTrigger, hote }: ContexteMouvement,
  nettoyages: Nettoyages,
): void {
  const tuiles = gsap.utils.toArray<HTMLElement>('[data-ap-tuile]', hote);
  if (tuiles.length === 0) return;
  const r = rayon(hote, '--radius-panel', '20px');
  gsap.set(tuiles, { clipPath: forme(DEPART_HAUT, r) });
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  tl.to(
    tuiles,
    {
      clipPath: forme(FIN, r),
      duration: 1,
      ease: 'expo.inOut',
      stagger: 0.1,
      clearProps: 'clipPath',
    },
    0,
  );
  gsap.utils.toArray<HTMLElement>('[data-compte]', hote).forEach((span, i) => {
    const final = span.textContent ?? '0';
    const fin = Number(final);
    const o = { v: 0 };
    span.textContent = '0';
    nettoyages.push(() => (span.textContent = final));
    tl.fromTo(
      o,
      { v: 0 },
      {
        v: fin,
        duration: fin > NOMBRE_ELEVE ? 1.6 : 0.9,
        ease: 'power2.out',
        onUpdate: () => (span.textContent = String(Math.round(o.v))),
      },
      0.3 + i * 0.1,
    );
  });
  const jetons = gsap.utils.toArray<HTMLElement>('[data-ap-jetons] > li', hote);
  nettoyages.push(() => jetons.forEach((j) => j.classList.remove('is-on')));
  jetons.forEach((j, i) => tl.call(() => j.classList.add('is-on'), undefined, 0.5 + i * 0.08));
  tl.from(
    '[data-ap-carres] > span',
    {
      scale: 0,
      autoAlpha: 0,
      duration: 0.5,
      stagger: 0.07,
      clearProps: 'opacity,visibility,transform',
    },
    0.45,
  )
    .from(
      '[data-ap-legende] > span',
      { y: 10, autoAlpha: 0, duration: 0.5, stagger: 0.08, clearProps: NETTOYER },
      1.3,
    )
    .from(
      '[data-ap-pastilles] > span',
      { y: 30, rotation: -12, autoAlpha: 0, duration: 0.8, stagger: 0.1, clearProps: NETTOYER },
      0.6,
    )
    .to('[data-ap-curseur]', { xPercent: 100, duration: 0.5, ease: 'power3.inOut' }, 1.1)
    .to('[data-ap-curseur]', { xPercent: 0, duration: 0.5, ease: 'power3.inOut' }, 1.9)
    .fromTo(
      '[data-ap-rature]',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6, ease: 'power2.inOut' },
      1.2,
    );
  ScrollTrigger.create({
    trigger: '[data-ap-tuiles]',
    start: 'top 80%',
    once: true,
    onEnter: () => tl.play(),
  });
}

/** 30. Pour qui : manifeste lu mot à mot, code « avant » écrit puis rayé, calendrier « après » (épinglé ≥ 1024 px). */
function animerPourQui(c: ContexteMouvement, nettoyages: Nettoyages): void {
  const { gsap, SplitText, ScrollTrigger, hote, large } = c;
  const section = hote.querySelector<HTMLElement>('[data-ap-pourqui]');
  const manifeste = hote.querySelector<HTMLElement>('[data-ap-manifeste]');
  const avant = hote.querySelector<HTMLElement>('[data-ap-avant]');
  const apres = hote.querySelector<HTMLElement>('[data-ap-apres]');
  if (!section || !manifeste || !avant || !apres) return;
  const r = rayon(hote, '--radius-panel', '20px');
  const split = SplitText.create(manifeste, { type: 'words' });
  nettoyages.push(() => split.revert());
  const todos = gsap.utils.toArray<HTMLElement>('[data-ap-todo]', hote);
  const tp = gsap.timeline({ defaults: { ease: 'none' }, paused: !large });
  gsap.set(split.words, { opacity: 0.16 });
  gsap.set(todos, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set(apres, { autoAlpha: 0, y: 40 });
  tp.to(split.words, { opacity: 1, stagger: 0.06, duration: 0.3 }, 0).to(
    todos,
    { clipPath: 'inset(0% 0% 0% 0%)', stagger: 0.14, duration: 0.25 },
    0.1,
  );
  todos.forEach((ligne, i) => {
    const t0 = 1.15 + i * 0.12;
    tp.fromTo(
      ligne.querySelector('.ap-todo__texte'),
      { '--rature': '0%', opacity: 1 },
      { '--rature': '100%', opacity: 0.55, duration: 0.18, ease: 'power2.inOut' },
      t0,
    ).fromTo(
      ligne.querySelector('.ap-todo__marque'),
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.15, ease: 'power2.out' },
      t0 + 0.08,
    );
  });
  if (large)
    tp.to(avant, { autoAlpha: 0, y: -30, scale: 0.97, duration: 0.3, ease: 'power2.in' }, 1.95);
  tp.to(apres, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, 2.25)
    .fromTo(
      '[data-ap-apres-piece]',
      { clipPath: forme(DEPART_HAUT, r) },
      { clipPath: forme('inset(-20% -20% -20% -20%', r), duration: 0.45, ease: 'expo.out' },
      2.25,
    )
    .to({}, { duration: 0.35 });
  if (large) {
    section.classList.add('ap-pourqui--pin');
    nettoyages.push(() => section.classList.remove('ap-pourqui--pin'));
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: PIN_POUR_QUI,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      animation: tp,
      invalidateOnRefresh: true,
      refreshPriority: 1,
    });
  } else {
    tp.timeScale(1.6);
    ScrollTrigger.create({
      trigger: section,
      start: 'top 65%',
      once: true,
      onEnter: () => tp.play(),
    });
  }
}

/** 31. Comment c'est fait : le panneau se pose ; en grand écran le point actif suit la progression du défilement. */
function animerComment(
  { gsap, ScrollTrigger, hote, large }: ContexteMouvement,
  rappels: RappelsAPropos,
): void {
  gsap.fromTo(
    '[data-ap-panneau]',
    { y: 40, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.9,
      ease: 'expo.out',
      clearProps: NETTOYER,
      scrollTrigger: { trigger: '[data-ap-comment-scene]', start: 'top 75%', once: true },
    },
  );
  if (!large || !hote.querySelector('[data-ap-comment]')) return;
  ScrollTrigger.create({
    trigger: '[data-ap-comment]',
    start: 'top 55%',
    end: 'bottom 45%',
    onUpdate: (s) =>
      rappels.pointComment(Math.min(POINTS_COMMENT - 1, Math.floor(s.progress * POINTS_COMMENT))),
  });
}

/** 27. Copier, Régler, Livrer : épinglé (≥ 1024 px), barre de progression, étapes en graisse 800, scène qui change. */
function animerGestes(c: ContexteMouvement, rappels: RappelsAPropos, nettoyages: Nettoyages): void {
  const { gsap, ScrollTrigger, hote, large } = c;
  const section = hote.querySelector<HTMLElement>('[data-ap-gestes]');
  const vues = gsap.utils.toArray<HTMLElement>('[data-ap-vue]', hote);
  if (!section || vues.length === 0) return;
  const noms = gsap.utils.toArray<HTMLElement>('[data-ap-etape] .ap-etape__nom', hote);
  const textes = gsap.utils.toArray<HTMLElement>('[data-ap-etape] .ap-etape__texte', hote);
  nettoyages.push(() => rappels.designGestes(0));
  if (!large) {
    vues.forEach((vue) => {
      gsap.fromTo(
        vue,
        { clipPath: forme(DEPART_HAUT, '14px') },
        {
          clipPath: forme(FIN, '14px'),
          duration: 0.9,
          ease: 'expo.out',
          clearProps: 'clipPath',
          scrollTrigger: { trigger: vue, start: 'top 85%', once: true },
        },
      );
    });
    ScrollTrigger.create({
      trigger: vues[1] ?? section,
      start: 'top 70%',
      end: 'bottom 30%',
      onUpdate: (s) =>
        rappels.designGestes(Math.min(DESIGNS_GESTES - 1, Math.floor(s.progress * DESIGNS_GESTES))),
    });
    return;
  }
  section.classList.add('ap-gestes--pin');
  nettoyages.push(() => section.classList.remove('ap-gestes--pin'));
  gsap.set(vues.slice(1), { clipPath: forme(DEPART_HAUT, '14px') });
  gsap.set(noms[0] ?? [], { '--wght': 800, opacity: 1 });
  gsap.set(noms.slice(1), { '--wght': 460, opacity: 0.4 });
  gsap.set(textes.slice(1), { opacity: 0.4 });
  const tg = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: PIN_GESTES,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 2,
      onUpdate: (s) => rappels.designGestes(s.progress < 0.39 ? 0 : s.progress < 0.5 ? 1 : 2),
    },
  });
  tg.to('[data-ap-progression]', { scaleY: 1, duration: 3 }, 0);
  [1, 2].forEach((i) => {
    const t0 = i - 0.15;
    tg.to(noms[i - 1] ?? [], { '--wght': 460, opacity: 0.4, duration: 0.3 }, t0)
      .to(textes[i - 1] ?? [], { opacity: 0.4, duration: 0.3 }, t0)
      .to(noms[i] ?? [], { '--wght': 800, opacity: 1, duration: 0.3 }, t0)
      .to(textes[i] ?? [], { opacity: 1, duration: 0.3 }, t0)
      .to(vues[i] ?? [], { clipPath: forme(FIN, '14px'), duration: 0.4, ease: 'power2.inOut' }, t0)
      .fromTo(
        vues[i - 1] ?? [],
        { scale: 1 },
        { scale: 0.96, autoAlpha: 0.3, duration: 0.4, ease: 'power2.inOut' },
        t0,
      );
  });
  tg.from('[data-ap-zip] li', { x: -14, autoAlpha: 0, stagger: 0.04, duration: 0.2 }, 2.1).to(
    {},
    { duration: 0.6 },
  );
}

/** 28 et 29. Titres de section (mots depuis un masque) et rangées qui arrivent de la gauche. */
function animerTitresEtRangees(
  { gsap, SplitText, ScrollTrigger, hote }: ContexteMouvement,
  nettoyages: Nettoyages,
): void {
  for (const titre of gsap.utils.toArray<HTMLElement>('.ap-titre', hote)) {
    const split = SplitText.create(titre, { type: 'words', mask: 'words', wordsClass: 'word' });
    nettoyages.push(() => split.revert());
    gsap.fromTo(
      split.words,
      { yPercent: 105 },
      {
        yPercent: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'expo.out',
        scrollTrigger: { trigger: titre, start: 'top 85%', once: true },
      },
    );
  }
  gsap.set('[data-ap-promesses] > div, [data-ap-points] > li', { x: -16, autoAlpha: 0 });
  ScrollTrigger.batch('[data-ap-promesses] > div, [data-ap-points] > li', {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      gsap.fromTo(
        els,
        { x: -16, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          stagger: 0.07,
          duration: 0.7,
          ease: 'expo.out',
          clearProps: NETTOYER,
        },
      ),
  });
}

/** 31 (photo). Photo révélée en masque, parallaxe dans son cadre (grand écran). */
function animerPhotos({ gsap, hote, large }: ContexteMouvement): void {
  gsap.utils.toArray<HTMLElement>('[data-ap-revele]', hote).forEach((figure, i) => {
    const image = figure.querySelector('img');
    const r = rayon(hote, '--radius-case', '20px');
    gsap
      .timeline({ scrollTrigger: { trigger: figure, start: 'top 82%', once: true } })
      .to(figure, {
        clipPath: `inset(0% 0 0 0 round ${r})`,
        duration: 1.1,
        ease: 'expo.inOut',
        delay: i * 0.12,
      })
      .from(image, { scale: 1.2, duration: 1.4, ease: 'expo.out', clearProps: 'scale' }, '<0.1');
    if (large && image) {
      gsap.fromTo(
        image,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        },
      );
    }
  });
}

/** 32. Contribuer : le dossier se révèle, ses lignes arrivent en cascade, puis les quatre étapes. */
function animerContribuer({ gsap, hote }: ContexteMouvement): void {
  if (!hote.querySelector('[data-ap-dossier]')) return;
  const r = rayon(hote, '--radius-panel', '20px');
  gsap
    .timeline({
      scrollTrigger: { trigger: '[data-ap-dossier]', start: 'top 80%', once: true },
      defaults: { ease: 'expo.out' },
    })
    .fromTo(
      '[data-ap-dossier] .ngs-code',
      { clipPath: forme(DEPART_BAS, r) },
      { clipPath: forme(FIN, r), duration: 0.9, ease: 'expo.inOut', clearProps: 'clipPath' },
    )
    .fromTo(
      '[data-ap-arbre-ligne]',
      { x: -12, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, clearProps: NETTOYER },
      '-=0.35',
    )
    .fromTo(
      '[data-ap-parcours] > li',
      { y: 12, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08, clearProps: NETTOYER },
      '-=0.3',
    );
}

/** 33. Qui le développe : portrait révélé, carrés de famille, nom lettre par lettre, cartes de liens, parallaxe. */
function animerQui(c: ContexteMouvement, nettoyages: Nettoyages): void {
  const { gsap, SplitText, hote, large } = c;
  const cadre = hote.querySelector<HTMLElement>('[data-ap-portrait-cadre]');
  const nom = hote.querySelector<HTMLElement>('[data-ap-nom]');
  if (!cadre || !nom) return;
  const r = rayon(hote, '--radius-panel', '20px');
  const split = SplitText.create(nom, { type: 'chars,words', mask: 'words' });
  nettoyages.push(() => split.revert());
  gsap
    .timeline({
      scrollTrigger: { trigger: '[data-ap-portrait]', start: 'top 78%', once: true },
      defaults: { ease: 'expo.out' },
    })
    .fromTo(
      cadre,
      { clipPath: forme(DEPART_HAUT, r) },
      { clipPath: forme(FIN, r), duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' },
    )
    .from('[data-ap-portrait-img]', { scale: 1.18, duration: 1.6, clearProps: 'scale' }, '<0.15')
    .from(
      '[data-ap-marque] > span',
      {
        scale: 0.3,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.07,
        clearProps: 'opacity,visibility,scale',
      },
      '-=1.0',
    )
    .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.025 }, '-=1.1')
    .fromTo(
      '[data-ap-liens] > li',
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, clearProps: NETTOYER },
      '-=0.7',
    );
  if (large) {
    gsap.fromTo(
      '[data-ap-portrait-img]',
      { yPercent: -4 },
      {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: { trigger: cadre, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      },
    );
  }
}

/** Monte toute la page. L'ordre de création des épinglages est celui de la page (voir `refreshPriority`). */
export function monterAPropos(contexte: ContexteMouvement, rappels: RappelsAPropos): Demontage {
  const nettoyages: Nettoyages = [];
  animerHero(contexte, nettoyages);
  animerApesanteur(contexte, nettoyages);
  animerChiffres(contexte, nettoyages);
  animerPourQui(contexte, nettoyages);
  animerComment(contexte, rappels);
  animerGestes(contexte, rappels, nettoyages);
  animerTitresEtRangees(contexte, nettoyages);
  animerPhotos(contexte);
  animerContribuer(contexte);
  animerQui(contexte, nettoyages);
  return () => {
    for (const nettoyer of nettoyages.reverse()) nettoyer();
  };
}
