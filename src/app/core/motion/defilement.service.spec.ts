import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import type Lenis from 'lenis';
import { DefilementService } from './defilement.service';
import { MotionService } from './motion.service';

@Component({
  selector: 'app-page-test',
  template: `
    <section id="cible"><h2>Cible</h2></section>
    <section id="autre"><h2>Autre</h2></section>
  `,
})
class PageTestComponent {}

describe('défilement doux vers les sections', () => {
  const reduit = signal(false);
  let aller: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reduit.set(false);
    aller = vi.fn();
    window.scrollTo = aller as unknown as typeof window.scrollTo;
    TestBed.configureTestingModule({
      providers: [
        { provide: MotionService, useValue: { mouvementReduit: reduit.asReadonly() } },
        provideRouter(
          [{ path: '', component: PageTestComponent }],
          withInMemoryScrolling({
            scrollPositionRestoration: 'enabled',
            anchorScrolling: 'disabled',
          }),
        ),
      ],
    });
  });

  it('défile en douceur (smooth) sans Lenis', () => {
    const page = TestBed.createComponent(PageTestComponent);
    document.body.appendChild(page.nativeElement);
    page.detectChanges();
    expect(TestBed.inject(DefilementService).versSection('cible')).toBe(true);
    expect(aller).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    page.nativeElement.remove();
  });

  it('saute (instantané) quand le système demande moins de mouvement', () => {
    reduit.set(true);
    const page = TestBed.createComponent(PageTestComponent);
    document.body.appendChild(page.nativeElement);
    page.detectChanges();
    TestBed.inject(DefilementService).versSection('cible');
    expect(aller).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    page.nativeElement.remove();
  });

  it('passe par Lenis quand il est actif, avec le décalage du header', () => {
    const page = TestBed.createComponent(PageTestComponent);
    document.body.appendChild(page.nativeElement);
    page.detectChanges();
    const header = document.createElement('header');
    header.className = 'ngs-header';
    header.getBoundingClientRect = () => ({ height: 56 }) as DOMRect;
    document.body.appendChild(header);
    const lenis = { scrollTo: vi.fn(), resize: vi.fn(), scroll: 0 };
    const service = TestBed.inject(DefilementService);
    service.enregistrerLenis(lenis as unknown as Lenis);
    service.versSection('cible');
    // Position chiffrée : en jsdom la section est à 0, le décalage (56 + 16) est borné à 0.
    expect(lenis.resize).toHaveBeenCalled();
    expect(lenis.scrollTo).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 1.1 }));
    expect(aller).not.toHaveBeenCalled();
    service.enregistrerLenis(null);
    header.remove();
    page.nativeElement.remove();
  });

  it('place le focus sur la section, sans défilement, et ignore une section absente', () => {
    const page = TestBed.createComponent(PageTestComponent);
    document.body.appendChild(page.nativeElement);
    page.detectChanges();
    const service = TestBed.inject(DefilementService);
    expect(service.versSection('absente')).toBe(false);
    service.versSection('autre');
    const section = document.getElementById('autre');
    expect(section?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(section);
    page.nativeElement.remove();
  });

  it('suit l’ancre d’une navigation : saut à l’arrivée, douceur ensuite sur la même page', () => {
    const page = TestBed.createComponent(PageTestComponent);
    document.body.appendChild(page.nativeElement);
    page.detectChanges();
    const service = TestBed.inject(DefilementService);
    service.suivreNavigation('/a-propos#cible', 'cible', '/');
    expect(aller).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'instant' }));
    service.suivreNavigation('/a-propos#autre', 'autre', '/a-propos');
    expect(aller).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    service.suivreNavigation('/#cible', 'cible', '/a-propos');
    expect(aller).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'instant' }));
    page.nativeElement.remove();
  });
});
