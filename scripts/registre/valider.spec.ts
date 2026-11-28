import type { FichiersRessource } from './sources.ts';
import { EntreeBrute, validerRegistre } from './valider.ts';

const GABARIT_TAILWIND = '<button class="rounded-ngs px-4" type="button"><ng-content /></button>';
const GABARIT_CSS = '<button class="barre__action" type="button"><ng-content /></button>';

/** Fichiers minimaux et valides d'une ressource nommée « barre » (bloc de test). */
const FICHIERS: FichiersRessource = {
  'barre.component.ts': `@Component({
  templateUrl: './barre.component.html',
  /*STYLE*/
})
export class BarreComponent {
  readonly animations = input(true);
}`,
  'tailwind/barre.component.html': GABARIT_TAILWIND,
  'tailwind/hote.txt': 'block',
  'css/barre.component.html': GABARIT_CSS,
  'css/barre.component.css': '.barre__action { color: var(--ngs-color-text, #0b0b0c); }',
  'fiche.json': JSON.stringify({ usage: '<ngs-barre />', api: [] }),
  'demo/demo.component.ts': 'export class DemoComponent {}',
};

const UN_SECTEUR = ['restaurant'];

const MOTION = {
  resume: { fr: 'La barre descend en entrant.' },
  moments: ['entree'],
  technique: '@keyframes CSS',
};

function ressource(surcharge: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: 1,
    slug: 'navbar-test',
    categorie: 'bloc',
    type: 'navbar',
    titre: { fr: 'Barre' },
    description: { fr: 'Une barre de navigation.' },
    secteurs: UN_SECTEUR,
    tags: ['navbar', 'menu'],
    contratTokens: 1,
    variantes: ['tailwind', 'css'],
    angularMin: '22.0',
    licence: 'MIT',
    auteur: { nom: 'Sidy' },
    statut: 'provisoire',
    ajouteLe: '2026-11-26',
    dependances: { npm: [], ressources: [] },
    motion: null,
    ...surcharge,
  };
}

function design(surcharge: Record<string, unknown> = {}): Record<string, unknown> {
  const clair = Object.fromEntries(
    [
      '--ngs-color-action',
      '--ngs-color-on-action',
      '--ngs-color-surface',
      '--ngs-color-surface-alt',
      '--ngs-color-text',
      '--ngs-color-text-muted',
      '--ngs-color-border',
      '--ngs-color-danger',
      '--ngs-radius',
      '--ngs-density',
      '--ngs-font-family',
      '--ngs-duration',
    ].map((token) => [token, 'valeur']),
  );
  return {
    schema: 1,
    slug: 'fleuve',
    categorie: 'design',
    titre: { fr: 'Design Fleuve' },
    description: { fr: 'Un habillage.' },
    secteurs: [],
    tags: [],
    contratTokens: 1,
    valeurs: { clair },
    licence: 'MIT',
    statut: 'provisoire',
    ajouteLe: '2026-11-26',
    ...surcharge,
  };
}

function valider(meta: unknown, chemin = 'blocs/navbar-test'): readonly string[] {
  return validerRegistre([{ chemin, meta, fichiers: FICHIERS }]).erreurs;
}

describe('validerRegistre', () => {
  it('accepte une ressource et un design valides', () => {
    const entrees: EntreeBrute[] = [
      { chemin: 'blocs/navbar-test', meta: ressource(), fichiers: FICHIERS },
      { chemin: 'designs/fleuve', meta: design() },
    ];
    const resultat = validerRegistre(entrees);
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.metas).toHaveLength(2);
  });

  it('accepte un motion complet', () => {
    expect(valider(ressource({ motion: MOTION }))).toEqual([]);
  });

  it('accepte rejouer quand la sortie figure dans les moments', () => {
    const motion = {
      ...MOTION,
      moments: ['entree', 'sortie'],
      rejouer: { entree: true, sortie: 'hero-sortie' },
    };
    expect(valider(ressource({ motion }))).toEqual([]);
  });

  it('accepte une taille de rendu d’aperçu de case', () => {
    expect(valider(ressource({ apercuCase: { largeur: 960, hauteur: 540 } }))).toEqual([]);
  });

  it('refuse une taille de rendu d’aperçu hors bornes, incomplète ou inconnue', () => {
    expect(valider(ressource({ apercuCase: { largeur: 100, hauteur: 540 } }))).toEqual([
      expect.stringContaining('« apercuCase.largeur » doit être un entier de 240 à 1600'),
    ]);
    expect(valider(ressource({ apercuCase: { largeur: 960 } }))).toEqual([
      expect.stringContaining('« apercuCase.hauteur »'),
    ]);
    expect(valider(ressource({ apercuCase: { largeur: 960, hauteur: 540, ratio: 2 } }))).toEqual([
      expect.stringContaining('champ inconnu « ratio »'),
    ]);
    expect(valider(ressource({ apercuCase: '16/9' }))).toEqual([
      expect.stringContaining('« apercuCase » doit être'),
    ]);
  });

  it('accepte le rendu grand écran de l’aperçu (ADR 0027)', () => {
    expect(valider(ressource({ rendu: 'grand-ecran' }))).toEqual([]);
  });

  it('refuse un rendu inconnu, ou combiné à une taille de rendu déclarée', () => {
    expect(valider(ressource({ rendu: 'tablette' }))).toEqual([
      expect.stringContaining("« rendu » doit valoir l'une de ces valeurs : grand-ecran"),
    ]);
    expect(
      valider(ressource({ rendu: 'grand-ecran', apercuCase: { largeur: 960, hauteur: 540 } })),
    ).toEqual([expect.stringContaining('« rendu » et « apercuCase » sont exclusifs')]);
  });

  it('refuse l’ancienne taille de case, supprimée avec la planche uniforme (ADR 0026)', () => {
    expect(valider(ressource({ tailleCase: 'large' }))).toEqual([
      expect.stringContaining('champ inconnu « tailleCase »'),
    ]);
  });

  it('exige le champ motion, null quand la ressource n’a aucune animation', () => {
    const sans = ressource();
    delete sans['motion'];
    expect(valider(sans)).toEqual([expect.stringContaining('« motion » est obligatoire')]);
    expect(valider(ressource({ motion: 'oui' }))).toEqual([
      expect.stringContaining('« motion » doit valoir null ou un objet'),
    ]);
  });

  it('refuse un motion sans moment, avec un moment inconnu ou un champ inconnu', () => {
    expect(valider(ressource({ motion: { ...MOTION, moments: [] } }))).toEqual([
      expect.stringContaining('au moins un moment'),
    ]);
    expect(valider(ressource({ motion: { ...MOTION, moments: ['clic'] } }))).toEqual([
      expect.stringContaining('moment inconnu « clic »'),
    ]);
    expect(valider(ressource({ motion: { ...MOTION, duree: 3 } }))).toEqual([
      expect.stringContaining('champ inconnu « duree »'),
    ]);
  });

  it('refuse un motion sans résumé français ni technique', () => {
    expect(valider(ressource({ motion: { ...MOTION, resume: 'texte' } }))).toEqual([
      expect.stringContaining('« motion.resume » doit être'),
    ]);
    expect(valider(ressource({ motion: { ...MOTION, technique: ' ' } }))).toEqual([
      expect.stringContaining('« motion.technique » est obligatoire'),
    ]);
  });

  it('refuse rejouer.sortie sans sortie dans les moments, et une entrée qui ne vaut pas true', () => {
    expect(
      valider(ressource({ motion: { ...MOTION, rejouer: { sortie: 'hero-sortie' } } })),
    ).toEqual([expect.stringContaining('exige « sortie » dans « motion.moments »')]);
    expect(valider(ressource({ motion: { ...MOTION, rejouer: { entree: false } } }))).toEqual([
      expect.stringContaining('« motion.rejouer.entree » doit valoir true'),
    ]);
  });

  it('refuse l’ancien champ animee (remplacé par motion, ADR 0007)', () => {
    expect(valider(ressource({ animee: true }))).toEqual([
      expect.stringContaining('champ inconnu « animee »'),
    ]);
  });

  it('refuse ces options sur un design, qui n’a ni animation ni case propre', () => {
    const erreurs = validerRegistre([
      {
        chemin: 'designs/fleuve',
        meta: design({ motion: null, apercuCase: { largeur: 520, hauteur: 400 } }),
      },
    ]).erreurs;
    expect(erreurs).toEqual([
      expect.stringContaining('champ inconnu « motion »'),
      expect.stringContaining('champ inconnu « apercuCase »'),
    ]);
  });

  it('refuse un type inconnu et un type d’une autre catégorie', () => {
    expect(valider(ressource({ type: 'nav-bar' }))).toEqual([
      expect.stringContaining('type « nav-bar » inconnu'),
    ]);
    expect(valider(ressource({ type: 'bouton' }))).toEqual([
      expect.stringContaining('type « bouton » inconnu dans la catégorie « bloc »'),
    ]);
  });

  it('refuse un secteur inconnu, plus de 3 secteurs et plus de 8 tags', () => {
    expect(valider(ressource({ secteurs: ['jardinage'] }))).toEqual([
      expect.stringContaining('« secteurs » : valeur inconnue'),
    ]);
    const quatre = ['voyage', 'restaurant', 'transport', 'sante'];
    expect(valider(ressource({ secteurs: quatre }))).toEqual([
      expect.stringContaining('3 éléments au plus'),
    ]);
    const neuf = Array.from({ length: 9 }, (_, i) => `tag-${i}`);
    expect(valider(ressource({ tags: neuf }))).toEqual([
      expect.stringContaining('8 éléments au plus'),
    ]);
  });

  it('refuse un tag non normalisé (espace, majuscule)', () => {
    expect(valider(ressource({ tags: ['mode sombre'] }))).toHaveLength(1);
    expect(valider(ressource({ tags: ['Menu'] }))).toHaveLength(1);
    expect(valider(ressource({ tags: ['hôtel', 'thème-visuel'] }))).toEqual([]);
  });

  it('refuse une dépendance non vide en v1', () => {
    const dependances = { npm: [{ nom: 'gsap', version: '3' }], ressources: [] };
    expect(valider(ressource({ dependances }))).toEqual([expect.stringContaining('dependances')]);
  });

  it('refuse un texte français absent ou vide, et une description trop longue', () => {
    expect(valider(ressource({ titre: { en: 'Bar' } }))).toEqual([
      expect.stringContaining('« titre »'),
    ]);
    expect(valider(ressource({ description: { fr: ' ' } }))).toHaveLength(1);
    expect(valider(ressource({ description: { fr: 'a'.repeat(161) } }))).toEqual([
      expect.stringContaining('dépasse 160 caractères'),
    ]);
  });

  it('refuse un champ inconnu (faute de frappe) et un schéma inconnu', () => {
    expect(valider(ressource({ secteur: ['voyage'] }))).toEqual([
      expect.stringContaining('champ inconnu « secteur »'),
    ]);
    expect(valider(ressource({ schema: 2 }))).toEqual([expect.stringContaining('« schema »')]);
  });

  it('exige les deux variantes, un slug kebab-case et une date valide', () => {
    expect(valider(ressource({ variantes: ['css'] }))).toHaveLength(1);
    expect(valider(ressource({ slug: 'Navbar Test' }), 'blocs/Navbar Test')).toHaveLength(1);
    expect(valider(ressource({ ajouteLe: '2026-13-45' }))).toHaveLength(1);
  });

  it('refuse un dossier qui ne correspond pas à la catégorie et au slug', () => {
    expect(valider(ressource(), 'composants/navbar-test')).toEqual([
      expect.stringContaining("le dossier doit s'appeler « blocs/navbar-test »"),
    ]);
  });

  it('refuse un slug utilisé deux fois dans tout le registre', () => {
    const resultat = validerRegistre([
      { chemin: 'blocs/navbar-test', meta: ressource(), fichiers: FICHIERS },
      {
        chemin: 'composants/navbar-test',
        meta: ressource({ categorie: 'composant', type: 'carte' }),
        fichiers: FICHIERS,
      },
    ]);
    expect(resultat.erreurs).toEqual([
      expect.stringContaining('déjà utilisé par blocs/navbar-test'),
    ]);
    expect(resultat.metas).toEqual([]);
  });

  it('refuse un design mis en avant qui n’existe pas', () => {
    const erreurs = valider(ressource({ designsMisEnAvant: ['inconnu'] }));
    expect(erreurs).toEqual([expect.stringContaining('design mis en avant « inconnu »')]);
  });

  it('refuse un design sans les 12 tokens du contrat ou avec un token inconnu', () => {
    const incomplet = design({ valeurs: { clair: { '--ngs-color-action': 'x' } } });
    expect(valider(incomplet, 'designs/fleuve')).toEqual([
      expect.stringContaining('tokens manquants'),
    ]);
    const inconnu = design({ valeurs: { clair: { '--ngs-couleur': 'x' } } });
    expect(valider(inconnu, 'designs/fleuve')[0]).toContain('token inconnu « --ngs-couleur »');
  });

  it('refuse un fichier qui n’est pas un objet ou dont la catégorie est inconnue', () => {
    expect(valider([])).toEqual([expect.stringContaining('objet JSON')]);
    expect(valider(ressource({ categorie: 'widget' }))).toEqual([
      expect.stringContaining('« categorie »'),
    ]);
  });

  describe('fichiers de la ressource', () => {
    function avec(surcharge: Record<string, string>, retirer: string[] = []): EntreeBrute {
      const fichiers: Record<string, string> = { ...FICHIERS, ...surcharge };
      for (const chemin of retirer) delete fichiers[chemin];
      return { chemin: 'blocs/navbar-test', meta: ressource(), fichiers };
    }
    const erreursDe = (entree: EntreeBrute): readonly string[] => validerRegistre([entree]).erreurs;

    it('refuse une ressource dont le dossier ne contient aucun fichier lu', () => {
      const sans = { chemin: 'blocs/navbar-test', meta: ressource() };
      expect(erreursDe(sans)).toEqual([expect.stringContaining('fichiers de la ressource')]);
    });

    it('refuse un gabarit manquant, une fiche absente ou un composant en double', () => {
      expect(erreursDe(avec({}, ['css/barre.component.html']))).toEqual([
        expect.stringContaining('fichier manquant « css/barre.component.html »'),
      ]);
      expect(erreursDe(avec({}, ['fiche.json']))).toEqual([
        expect.stringContaining('fichier manquant « fiche.json »'),
      ]);
      expect(erreursDe(avec({}, ['demo/demo.component.ts']))).toEqual([
        expect.stringContaining('fichier manquant « demo/demo.component.ts »'),
      ]);
      expect(erreursDe(avec({ 'autre.component.ts': 'x' }))).toEqual([
        expect.stringContaining('exactement un « <nom>.component.ts »'),
      ]);
    });

    it('refuse un composant sans la ligne de style ni templateUrl', () => {
      const erreurs = erreursDe(avec({ 'barre.component.ts': 'export class A {}' }));
      expect(erreurs).toEqual([
        expect.stringContaining('doit contenir une fois la ligne /*STYLE*/'),
        expect.stringContaining('doit déclarer templateUrl'),
      ]);
    });

    it('refuse deux gabarits dont la structure diffère, pas seulement les classes', () => {
      const differe = avec({ 'css/barre.component.html': '<a class="x"><ng-content /></a>' });
      expect(erreursDe(differe)).toEqual([
        expect.stringContaining('ne sont pas équivalents (hors classes)'),
      ]);
    });

    it('exige l’input animations quand la ressource déclare un motion', () => {
      const sansInput = {
        chemin: 'blocs/navbar-test',
        meta: ressource({ motion: MOTION }),
        fichiers: {
          ...FICHIERS,
          'barre.component.ts': FICHIERS['barre.component.ts'].replace(
            'animations = input',
            'x = input',
          ),
        },
      };
      expect(erreursDe(sansInput)).toEqual([
        expect.stringContaining('exige l’input « animations »'),
      ]);
    });

    it('refuse une fiche.json mal formée', () => {
      expect(erreursDe(avec({ 'fiche.json': '{ pas du json' }))).toEqual([
        expect.stringContaining('n’est pas du JSON'),
      ]);
      expect(erreursDe(avec({ 'fiche.json': '{"usage":"x","api":[{"nom":"a"}]}' }))).toEqual([
        expect.stringContaining('« api » doit lister'),
      ]);
    });
  });
});
