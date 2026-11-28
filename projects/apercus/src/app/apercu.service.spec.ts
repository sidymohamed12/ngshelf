import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { messageReglages, messageSortie } from '@shared/apercu/protocole';
import { ApercuService } from './apercu.service';

const ORIGINE_SITE = 'http://localhost:4200';

function envoyer(
  donnees: unknown,
  origine = ORIGINE_SITE,
  source: MessageEventSource | null = window,
): void {
  window.dispatchEvent(new MessageEvent('message', { data: donnees, origin: origine, source }));
}

function demarrer(): ApercuService {
  const service = TestBed.inject(ApercuService);
  TestBed.inject(ApplicationRef).tick();
  return service;
}

describe('ApercuService', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    document.documentElement.removeAttribute('style');
    document.documentElement.className = '';
  });

  afterEach(() => vi.unstubAllGlobals());

  it('pose les réglages du site : variables du contrat, mode sombre, animations coupées', () => {
    const service = demarrer();
    envoyer(
      messageReglages({ vars: { '--ngs-radius': '18px' }, mode: 'sombre', animations: false }),
    );
    const racine = document.documentElement;
    expect(racine.style.getPropertyValue('--ngs-radius')).toBe('18px');
    expect(racine.classList.contains('dark')).toBe(true);
    expect(racine.classList.contains('ngs-sans-animation')).toBe(true);
    expect(service.mode()).toBe('sombre');
    expect(service.animations()).toBe(false);
  });

  it('ignore une origine qui n’est pas celle du site', () => {
    demarrer();
    envoyer(
      messageReglages({ vars: { '--ngs-radius': '99px' }, mode: 'sombre', animations: false }),
      'https://evil.test',
    );
    expect(document.documentElement.style.getPropertyValue('--ngs-radius')).toBe('');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('ignore un message qui ne vient pas de la fenêtre parente', () => {
    demarrer();
    envoyer(
      messageReglages({ vars: { '--ngs-radius': '99px' }, mode: 'sombre', animations: true }),
      ORIGINE_SITE,
      null,
    );
    expect(document.documentElement.style.getPropertyValue('--ngs-radius')).toBe('');
  });

  it('ne pose jamais une clé hors liste blanche ni une valeur dangereuse', () => {
    demarrer();
    envoyer({
      v: 1,
      type: 'ngs-reglages',
      vars: {
        '--ngs-radius': 'url(https://evil.test/x)',
        '--color-canvas': '#000000',
        '--ngs-density': '1.2',
      },
      mode: 'clair',
      animations: true,
    });
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--ngs-radius')).toBe('');
    expect(style.getPropertyValue('--color-canvas')).toBe('');
    expect(style.getPropertyValue('--ngs-density')).toBe('1.2');
  });

  it('ignore un message inconnu, de forme invalide ou d’une autre version', () => {
    demarrer();
    envoyer({ v: 2, type: 'ngs-reglages', vars: {}, mode: 'sombre', animations: false });
    envoyer({ v: 1, type: 'ngs-autre' });
    envoyer('ngs-reglages');
    envoyer(null);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('pose la classe de sortie sur les hôtes marqués et la lit comme une sortie valide', () => {
    demarrer();
    const hote = document.createElement('div');
    hote.setAttribute('data-hote', '');
    document.body.appendChild(hote);
    envoyer(messageSortie('hero-sortie'));
    expect(hote.classList.contains('hero-sortie')).toBe(true);
    hote.remove();
  });

  describe('état initial lu dans l’URL (aperçu d’une case)', () => {
    it('applique le design et le mode de l’adresse, et suit le mode sombre', () => {
      window.history.pushState({}, '', '/?design=fleuve&mode=sombre');
      const service = demarrer();
      const style = document.documentElement.style;
      expect(service.design()).toBe('fleuve');
      expect(style.getPropertyValue('--ngs-color-action')).toBe('#5fd0c8');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      window.history.pushState({}, '', '/');
    });

    it('coupe les animations quand le système demande moins de mouvement', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
      const service = demarrer();
      expect(service.mouvementReduit()).toBe(true);
      expect(service.animations()).toBe(false);
    });
  });

  describe('paramètres propres de la ressource', () => {
    const SLUG = 'galerie-accordeon';

    it('démarre sur les défauts de la ressource et expose des lecteurs sûrs', () => {
      const service = demarrer();
      service.ouvrir(SLUG);
      expect(Object.keys(service.parametres())).toContain('orientation');
      expect(service.choix('orientation', ['horizontal', 'vertical'], 'vertical')).toBe(
        'horizontal',
      );
      expect(service.nombre('hauteur', 1)).toBe(460);
      expect(service.booleen('legendes', false)).toBe(true);
      // Valeur inconnue de la scène : le repli, jamais un cast.
      expect(service.choix('orientation', ['a', 'b'], 'b')).toBe('b');
    });

    it('relit les paramètres de l’URL, même quand la route s’ouvre après le premier rendu', () => {
      window.history.pushState({}, '', '/?p.orientation=vertical&p.hauteur=300&p.legendes=0');
      const service = demarrer();
      service.ouvrir(SLUG);
      expect(service.parametres()).toMatchObject({
        orientation: 'vertical',
        hauteur: 300,
        legendes: false,
      });
      window.history.pushState({}, '', '/');
    });

    it('applique les paramètres du message du site, sur la liste blanche de la ressource', () => {
      const service = demarrer();
      service.ouvrir(SLUG);
      envoyer(
        messageReglages({
          vars: {},
          mode: 'clair',
          animations: true,
          params: { orientation: 'vertical', hauteur: 99_999, intrus: 'x', legendes: 'oui' },
        }),
      );
      expect(service.parametres()).toMatchObject({
        orientation: 'vertical',
        hauteur: 640,
        legendes: true,
      });
      expect('intrus' in service.parametres()).toBe(false);
    });

    it('n’a aucun paramètre pour une ressource qui n’en déclare pas', () => {
      const service = demarrer();
      service.ouvrir('boutons');
      expect(service.parametres()).toEqual({});
    });
  });
});
