import { readFileSync } from 'node:fs';
import { HEBERGEURS, SITE } from './site.config';

describe('configuration du site', () => {
  it('garde le préfixe ngs et un site en français', () => {
    expect(SITE.prefixe).toBe('ngs');
    expect(SITE.langue).toBe('fr');
  });

  it('ne déclare que des liens https et une adresse e-mail plausible', () => {
    const { portfolio, instagram, tiktok, linkedin, github, email } = SITE.auteur;
    for (const lien of [portfolio, instagram, tiktok, linkedin, github]) {
      expect(lien.startsWith('https://')).toBe(true);
    }
    expect(email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });

  it('a le même hébergeur que la maquette (ADR 0013 : Cloudflare)', () => {
    const maquette = readFileSync('design/maquette/js/config.js', 'utf8');
    expect(maquette).toMatch(new RegExp(`hebergeur: '${SITE.hebergeur}'`));
    expect(SITE.hebergeur).toBe('cloudflare');
    expect(HEBERGEURS[SITE.hebergeur].site.startsWith('https://')).toBe(true);
  });
});
