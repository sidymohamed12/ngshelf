import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { messageReglages, messageSortie } from '@shared/apercu/protocole';
import { ApercuService, etatInitial } from './apercu.service';

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

describe('etatInitial', () => {
  it('lit le mode et les animations de l’URL, clair et animé par défaut', () => {
    expect(etatInitial('')).toEqual({ mode: 'clair', animations: true });
    expect(etatInitial('?mode=sombre&animations=0')).toEqual({ mode: 'sombre', animations: false });
    expect(etatInitial('?mode=noir')).toEqual({ mode: 'clair', animations: true });
  });
});

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
});
