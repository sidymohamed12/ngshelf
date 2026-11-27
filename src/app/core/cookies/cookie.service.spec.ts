import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie.service';

function viderLesCookies(): void {
  for (const morceau of document.cookie.split('; ')) {
    const nom = morceau.split('=')[0];
    if (nom) {
      document.cookie = `${nom}=; Max-Age=0; Path=/`;
    }
  }
}

describe('CookieService', () => {
  beforeEach(viderLesCookies);
  afterEach(viderLesCookies);

  it('écrit puis relit un cookie', () => {
    const cookies = TestBed.inject(CookieService);
    cookies.ecrire('ngs_test', 'sombre', { dureeSecondes: 60 });
    expect(cookies.lire('ngs_test')).toBe('sombre');
  });

  it('encode les valeurs et ne confond pas deux noms qui se ressemblent', () => {
    const cookies = TestBed.inject(CookieService);
    cookies.ecrire('ngs_test_long', 'a; b=c');
    cookies.ecrire('ngs_test', 'autre');
    expect(cookies.lire('ngs_test_long')).toBe('a; b=c');
    expect(cookies.lire('ngs_test')).toBe('autre');
    expect(cookies.lire('test')).toBeNull();
  });

  it('supprime un cookie', () => {
    const cookies = TestBed.inject(CookieService);
    cookies.ecrire('ngs_test', 'x');
    cookies.supprimer('ngs_test');
    expect(cookies.lire('ngs_test')).toBeNull();
  });

  it("ne lit ni n'écrit rien côté serveur (prérendu)", () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const cookies = TestBed.inject(CookieService);
    document.cookie = 'ngs_test=present; Path=/';
    expect(cookies.lire('ngs_test')).toBeNull();
    cookies.ecrire('ngs_serveur', 'x');
    expect(document.cookie).not.toContain('ngs_serveur');
  });
});
