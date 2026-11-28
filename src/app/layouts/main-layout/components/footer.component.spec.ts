import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SITE } from '@core/config/site.config';
import { FooterComponent } from './footer.component';

describe('pied de page : dépôt du projet', () => {
  it('renseigne le dépôt de NgShelf', () => {
    expect(SITE.depot).toBe('https://github.com/sidymohamed12/ngshelf');
  });

  it('propose le lien du dépôt, externe et sûr', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const lien = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      `a[href="${SITE.depot}"]`,
    );
    expect(lien).not.toBeNull();
    expect(lien?.target).toBe('_blank');
    expect(lien?.rel).toBe('noopener noreferrer');
  });
});
