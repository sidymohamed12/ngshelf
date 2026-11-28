import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { TEXTES_APROPOS } from '@core/i18n/textes-apropos';
import { ContribuerAProposComponent } from './contribuer-a-propos.component';

describe('à propos : contribuer', () => {
  it('affiche le bouton du dépôt sans note « lien provisoire »', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ContribuerAProposComponent);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    const lien = page.querySelector<HTMLAnchorElement>(`a[href="${SITE.depot}"]`);
    expect(lien?.textContent).toContain(TEXTES_APROPOS.contribuerCta);
    expect(lien?.rel).toBe('noopener noreferrer');
    expect(page.textContent).not.toContain('provisoire');
  });
});
