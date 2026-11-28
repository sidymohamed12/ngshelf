import compteurs from '@generated/registre/compteurs.json';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TEXTES } from '@core/i18n/textes.fr';
import { RechercheService } from '@core/recherche/recherche.service';
import { CHARGEUR_INDEX, ChargeurIndex, chargerIndexGenere } from '@core/registre/registre.donnees';
import { RechercheDeclencheurComponent } from './recherche-declencheur.component';
import { RechercheDialogComponent } from './recherche-dialog.component';

/** jsdom n'implémente pas <dialog> : on rejoue le contrat utile (open, showModal, close, événement close). */
function simulerDialog(): void {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    }
  };
}

describe('recherche : dialogue et déclencheur', () => {
  let fixture: ComponentFixture<RechercheDialogComponent>;
  let navigation: ReturnType<typeof vi.spyOn>;
  let echec = false;

  const chargeur: ChargeurIndex = (categorie) => {
    if (echec) return Promise.reject(new Error('réseau coupé'));
    return chargerIndexGenere(categorie);
  };

  const racine = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const champ = (): HTMLInputElement => racine().querySelector('input') as HTMLInputElement;
  const dialogue = (): HTMLDialogElement => racine().querySelector('dialog') as HTMLDialogElement;
  const service = (): RechercheService => TestBed.inject(RechercheService);
  const options = (): HTMLElement[] => [
    ...racine().querySelectorAll<HTMLElement>('[role="option"]'),
  ];

  async function monter(): Promise<void> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CHARGEUR_INDEX, useValue: chargeur }],
    });
    navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(RechercheDialogComponent);
    await fixture.whenStable();
  }

  async function ouvrir(): Promise<void> {
    service().ouvrir();
    await fixture.whenStable();
  }

  async function saisir(texte: string): Promise<void> {
    champ().value = texte;
    champ().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  function touche(cible: EventTarget, key: string, extra: KeyboardEventInit = {}): KeyboardEvent {
    const evenement = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...extra,
    });
    cible.dispatchEvent(evenement);
    return evenement;
  }

  beforeEach(() => {
    simulerDialog();
    echec = false;
  });

  it('reste fermé et ne charge rien tant qu’on ne l’a pas ouvert', async () => {
    await monter();
    expect(dialogue().open).toBe(false);
    expect(racine().querySelector('[role="listbox"]')).toBeNull();
    expect(racine().querySelector('[role="status"]')?.textContent?.trim()).toBe('');
  });

  it('s’ouvre en modal avec le focus dans le champ et liste les résultats groupés par catégorie', async () => {
    await monter();
    await ouvrir();
    expect(dialogue().open).toBe(true);
    expect(document.activeElement).toBe(champ());
    const titres = [...racine().querySelectorAll('[role="group"]')].map((g) =>
      document.getElementById(g.getAttribute('aria-labelledby') ?? '')?.textContent?.trim(),
    );
    expect(titres).toEqual(['Composants', 'Blocs', 'Designs']);
    // Au plus 6 ressources montrées par groupe : les suivantes sont derrière le lien « Voir tout ».
    const { composant, bloc, design } = compteurs.categories;
    expect(options()).toHaveLength(
      [composant, bloc, design].reduce((n, c) => n + Math.min(c, 6), 0),
    );
    expect(racine().querySelector('a[href="/composants"]')?.textContent).toContain(
      `(${composant})`,
    );
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    expect(champ().getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('filtre à la frappe, surligne le mot trouvé et annonce le nombre de résultats', async () => {
    await monter();
    await ouvrir();
    await saisir('calend');
    expect(options()).toHaveLength(1);
    expect(options()[0].querySelector('mark')?.textContent).toBe('Calend');
    expect(racine().querySelector('[role="status"]')?.textContent).toContain('1 résultat');
    expect(options()[0].getAttribute('href')).toBe('/composants/calendrier/calendrier');
  });

  it('mène un design vers la page de sa catégorie, faute de fiche', async () => {
    await monter();
    await ouvrir();
    await saisir('fleuve');
    expect(options()[0].getAttribute('href')).toBe('/designs');
  });

  it('déplace l’option active aux flèches, en bouclant, et l’ouvre avec Entrée', async () => {
    await monter();
    await ouvrir();
    await saisir('champ');
    expect(options().length).toBeGreaterThan(1);
    touche(champ(), 'ArrowDown');
    await fixture.whenStable();
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    touche(champ(), 'ArrowUp');
    touche(champ(), 'ArrowUp');
    await fixture.whenStable();
    expect(options().at(-1)?.getAttribute('aria-selected')).toBe('true');
    const entree = touche(champ(), 'Enter');
    expect(entree.defaultPrevented).toBe(true);
    expect(navigation).toHaveBeenCalledWith(options().at(-1)?.getAttribute('href'));
    expect(service().ouverte()).toBe(false);
  });

  it('garde Tab dans le dialogue : du dernier élément au premier, et Maj+Tab dans l’autre sens', async () => {
    await monter();
    await ouvrir();
    const dernier = [...racine().querySelectorAll<HTMLElement>('a[href]')]
      .filter((a) => a.tabIndex >= 0)
      .at(-1) as HTMLElement;
    dernier.focus();
    const avant = touche(dernier, 'Tab');
    expect(avant.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(champ());
    const arriere = touche(champ(), 'Tab', { shiftKey: true });
    expect(arriere.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dernier);
    const milieu = touche(dernier, 'Tab', { shiftKey: true });
    expect(milieu.defaultPrevented).toBe(false);
  });

  it('garde le texte du titre d’un seul tenant autour du mot surligné', async () => {
    await monter();
    await ouvrir();
    await saisir('calend');
    expect(options()[0].querySelector('.ngs-result__title')?.textContent?.replace(/\s+/g, '')).toBe(
      'Calendrier',
    );
    expect(options()[0].querySelector('.ngs-result__title')?.textContent?.trim()).toBe(
      'Calendrier',
    );
  });

  it('affiche un état vide qui reprend la requête et propose le catalogue', async () => {
    await monter();
    await ouvrir();
    await saisir('zzzz');
    expect(options()).toHaveLength(0);
    expect(racine().textContent).toContain(TEXTES.recherche.videTitre('zzzz'));
    expect(racine().querySelector('a[href="/catalogue"]')).not.toBeNull();
  });

  it('affiche une erreur annoncée quand l’index ne se charge pas, puis les résultats au nouvel essai', async () => {
    echec = true;
    await monter();
    await ouvrir();
    expect(racine().querySelector('[role="alert"]')?.textContent).toContain(
      TEXTES.etats.erreurTitre,
    );
    echec = false;
    racine().querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
    await fixture.whenStable();
    expect(options().length).toBeGreaterThan(0);
  });

  it('ferme avec Échap depuis le champ, sans que le navigateur ne le vide d’abord', async () => {
    await monter();
    await ouvrir();
    await saisir('calend');
    const evenement = touche(champ(), 'Escape');
    await fixture.whenStable();
    expect(evenement.defaultPrevented).toBe(true);
    expect(service().ouverte()).toBe(false);
    expect(dialogue().open).toBe(false);
  });

  it('suit la fermeture native (Échap) et remet la requête à zéro', async () => {
    await monter();
    await ouvrir();
    await saisir('calend');
    dialogue().close();
    await fixture.whenStable();
    expect(service().ouverte()).toBe(false);
    await ouvrir();
    expect(champ().value).toBe('');
  });

  it('se ferme sur le bouton et sur un clic dans le fond, pas sur un clic dans le contenu', async () => {
    await monter();
    await ouvrir();
    racine()
      .querySelector('.ngs-dialog__body')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(service().ouverte()).toBe(true);
    dialogue().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(service().ouverte()).toBe(false);
    await ouvrir();
    racine().querySelector<HTMLButtonElement>('button[aria-label]')?.click();
    expect(service().ouverte()).toBe(false);
  });

  it('s’ouvre et se ferme avec Ctrl+K et ⌘K, et s’ouvre avec « / » hors d’un champ', async () => {
    await monter();
    touche(document.body, 'k', { ctrlKey: true });
    expect(service().ouverte()).toBe(true);
    touche(document.body, 'k', { metaKey: true });
    expect(service().ouverte()).toBe(false);
    touche(document.body, '/');
    expect(service().ouverte()).toBe(true);
  });

  it('ignore « / » quand on tape dans un champ', async () => {
    await monter();
    const autre = document.createElement('input');
    document.body.appendChild(autre);
    const evenement = touche(autre, '/');
    expect(evenement.defaultPrevented).toBe(false);
    expect(service().ouverte()).toBe(false);
    autre.remove();
  });

  it('a le même libellé accessible que son texte visible, annonce son raccourci et ouvre la recherche', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CHARGEUR_INDEX, useValue: chargeur }],
    });
    const declencheur = TestBed.createComponent(RechercheDeclencheurComponent);
    await declencheur.whenStable();
    const bouton = declencheur.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(bouton.getAttribute('aria-label')).toBe(TEXTES.recherche.declencheur);
    expect(bouton.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    bouton.click();
    expect(TestBed.inject(RechercheService).ouverte()).toBe(true);
  });
});
