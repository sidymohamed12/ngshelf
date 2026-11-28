import { MessageManipulation } from '@shared/apercu/protocole';
import { CLASSE_ACTIF, suivreManipulation } from './manipulation';

describe('suivreManipulation', () => {
  let messages: MessageManipulation[];
  let changements: boolean[];
  let arreter: () => void;

  beforeEach(() => {
    messages = [];
    changements = [];
    document.documentElement.className = '';
    window.scrollTo = vi.fn();
    arreter = suivreManipulation({
      fenetre: window,
      annoncer: (m) => messages.push(m),
      surChangement: (a) => changements.push(a),
    });
  });

  afterEach(() => arreter());

  const actif = (): boolean => document.documentElement.classList.contains(CLASSE_ACTIF);

  it('prend la main au premier clic dans l’aperçu et le dit au site, une seule fois', () => {
    window.dispatchEvent(new Event('pointerdown'));
    window.dispatchEvent(new Event('focus'));
    expect(actif()).toBe(true);
    expect(messages).toEqual([{ v: 1, type: 'ngs-manipulation', actif: true, echap: false }]);
    expect(changements).toEqual([true]);
  });

  it('prend aussi la main quand le site donne le focus à l’aperçu (bouton « Manipuler »)', () => {
    window.dispatchEvent(new Event('focus'));
    expect(actif()).toBe(true);
  });

  it('rend la main quand le focus part, sans demander le focus au site', () => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('blur'));
    expect(actif()).toBe(false);
    expect(messages.at(-1)).toMatchObject({ actif: false, echap: false });
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('rend la main avec Échap et demande au site de reprendre le focus', () => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(actif()).toBe(false);
    expect(messages.at(-1)).toMatchObject({ actif: false, echap: true });
  });

  it('laisse Échap à la ressource qui l’a déjà utilisé (visionneuse, menu)', () => {
    window.dispatchEvent(new Event('focus'));
    const evenement = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    evenement.preventDefault();
    document.dispatchEvent(evenement);
    expect(actif()).toBe(true);
  });

  it('ignore Échap et les autres touches quand l’aperçu n’a pas la main', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(messages).toEqual([]);
  });

  it('coupe la molette avant la ressource tant que la page a la main, puis la laisse passer', () => {
    const ressource = vi.fn();
    const cible = document.createElement('div');
    document.body.append(cible);
    cible.addEventListener('wheel', ressource);
    cible.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(ressource).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('focus'));
    cible.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    expect(ressource).toHaveBeenCalledTimes(1);
    cible.remove();
  });

  it('retire ses écouteurs et la classe à l’arrêt', () => {
    window.dispatchEvent(new Event('focus'));
    arreter();
    expect(actif()).toBe(false);
    const avant = messages.length;
    window.dispatchEvent(new Event('focus'));
    expect(messages.length).toBe(avant);
  });
});
