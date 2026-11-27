import { echelleApercu, urlApercu } from './apercu-frame.component';

describe('aperçu : cadre', () => {
  it('pointe vers /apercu/<slug>, jamais un srcdoc', () => {
    expect(urlApercu('boutons')).toBe('/apercu/boutons');
  });

  it('garde l’échelle à 1 en largeur adaptée ou quand la largeur tient', () => {
    expect(echelleApercu(600, 'auto')).toBe(1);
    expect(echelleApercu(600, 390)).toBe(1);
  });

  it('réduit l’aperçu quand sa largeur de test dépasse le cadre', () => {
    expect(echelleApercu(640, 1280)).toBe(0.5);
    expect(echelleApercu(0, 1280)).toBe(1);
  });
});
