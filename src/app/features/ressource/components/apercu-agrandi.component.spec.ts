import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEXTES_FICHE } from '@core/i18n/textes-fiche';
import { FicheRessource } from '@shared/models/fiche.model';
import { EtatFiche } from '../services/etat-fiche';
import { ApercuAgrandiComponent } from './apercu-agrandi.component';

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

const JEU = {
  '--ngs-color-action': '#0b6464',
  '--ngs-color-on-action': '#ffffff',
  '--ngs-color-surface': '#ffffff',
  '--ngs-color-surface-alt': '#f4f4f5',
  '--ngs-color-text': '#0b0b0c',
  '--ngs-color-text-muted': '#55555e',
  '--ngs-color-border': '#d9d9de',
  '--ngs-color-danger': '#b3261e',
  '--ngs-radius': '8px',
  '--ngs-density': '1',
  '--ngs-font-family': 'system-ui',
  '--ngs-duration': '160ms',
};

const FICHE = {
  meta: {
    slug: 'boutons',
    categorie: 'composant',
    type: 'bouton',
    titre: { fr: 'Boutons' },
    description: { fr: 'Des boutons.' },
    contratTokens: 1,
    statut: 'publie',
    angularMin: '22.0',
    licence: 'MIT',
    ajouteLe: '2026-11-28',
    designsMisEnAvant: ['planche'],
    motion: null,
  },
  usage: '',
  api: [],
  fichiers: [],
  pont: '',
  designs: [{ slug: 'planche', nom: 'Planche', clair: JEU, sombre: JEU }],
} as unknown as FicheRessource;

describe('aperçu agrandi (fenêtre modale, ADR 0022)', () => {
  let fixture: ComponentFixture<ApercuAgrandiComponent>;
  const dialogue = (): HTMLDialogElement =>
    (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;

  beforeEach(() => {
    simulerDialog();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    TestBed.configureTestingModule({ providers: [EtatFiche] });
    TestBed.inject(EtatFiche).ouvrir(FICHE);
    fixture = TestBed.createComponent(ApercuAgrandiComponent);
    fixture.componentRef.setInput('slug', 'boutons');
    fixture.componentRef.setInput('titre', 'Boutons');
    fixture.detectChanges();
  });

  it('reste fermée, sans iframe, tant qu’on ne l’ouvre pas', () => {
    expect(dialogue().open).toBe(false);
    expect(dialogue().querySelector('iframe')).toBeNull();
  });

  it('s’ouvre en modale avec l’aperçu et un nom accessible, et le résumé des réglages', async () => {
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialogue().open).toBe(true);
    expect(dialogue().getAttribute('aria-label')).toBe(TEXTES_FICHE.agrandi.label('Boutons'));
    expect(dialogue().querySelector('iframe')?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(dialogue().querySelector('.apercu-agrandi__resume')?.textContent).toContain('Planche');
  });

  it('se ferme par le bouton et détruit l’iframe', async () => {
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    await fixture.whenStable();
    (dialogue().querySelector('button[aria-label]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(dialogue().open).toBe(false);
    expect(dialogue().querySelector('iframe')).toBeNull();
  });

  it('se ferme sur Échap natif et sur un clic du fond', async () => {
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
    await fixture.whenStable();
    dialogue().close();
    fixture.detectChanges();
    expect(fixture.componentInstance.ouvert()).toBe(false);
    fixture.componentInstance.ouvert.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    dialogue().click();
    expect(fixture.componentInstance.ouvert()).toBe(false);
  });
});
