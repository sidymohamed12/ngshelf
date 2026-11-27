import { EntreeBrute, validerRegistre } from './valider.ts';

const UN_SECTEUR = ['restaurant'];

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
  return validerRegistre([{ chemin, meta }]).erreurs;
}

describe('validerRegistre', () => {
  it('accepte une ressource et un design valides', () => {
    const entrees: EntreeBrute[] = [
      { chemin: 'blocs/navbar-test', meta: ressource() },
      { chemin: 'designs/fleuve', meta: design() },
    ];
    const resultat = validerRegistre(entrees);
    expect(resultat.erreurs).toEqual([]);
    expect(resultat.metas).toHaveLength(2);
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
      { chemin: 'blocs/navbar-test', meta: ressource() },
      {
        chemin: 'composants/navbar-test',
        meta: ressource({ categorie: 'composant', type: 'carte' }),
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
});
