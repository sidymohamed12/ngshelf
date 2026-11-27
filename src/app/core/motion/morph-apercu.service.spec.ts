import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MotionService } from './motion.service';
import { MorphApercuService } from './morph-apercu.service';
import { NOM_TRANSITION_APERCU } from './transitions';

function scene(): HTMLElement {
  return document.createElement('div');
}

function nom(element: HTMLElement): string {
  return element.style.getPropertyValue('view-transition-name');
}

describe('MorphApercuService', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
    TestBed.inject(ApplicationRef).tick();
  });

  it('nomme la scène avant la navigation', () => {
    const service = TestBed.inject(MorphApercuService);
    const a = scene();
    service.nommer(a);
    expect(nom(a)).toBe(NOM_TRANSITION_APERCU);
  });

  it('ne laisse qu’un seul élément nommé à la fois', () => {
    const service = TestBed.inject(MorphApercuService);
    const a = scene();
    const b = scene();
    service.nommer(a);
    service.nommer(b);
    expect(nom(a)).toBe('');
    expect(nom(b)).toBe(NOM_TRANSITION_APERCU);
  });

  it('retire le nom à la fin de la navigation', async () => {
    const service = TestBed.inject(MorphApercuService);
    const a = scene();
    service.nommer(a);
    await TestBed.inject(Router).navigateByUrl('/composants');
    expect(nom(a)).toBe('');
  });

  it('ne nomme rien en mouvement réduit', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(MotionService);
    TestBed.inject(ApplicationRef).tick();
    const a = scene();
    TestBed.inject(MorphApercuService).nommer(a);
    expect(nom(a)).toBe('');
  });
});
