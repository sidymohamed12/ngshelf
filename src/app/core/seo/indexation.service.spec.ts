import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { IndexationService } from './indexation.service';

describe('IndexationService', () => {
  let head: HTMLHeadElement;
  let service: IndexationService;

  const canonique = (): string | null =>
    head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
  const robots = (): string | null =>
    head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;

  beforeEach(() => {
    head = TestBed.inject(DOCUMENT).head;
    head.querySelectorAll('link[rel="canonical"], meta[name="robots"]').forEach((e) => e.remove());
    service = TestBed.inject(IndexationService);
  });

  it('pose le canonique du chemin sans paramètres et reste indexable sans filtre', () => {
    service.definir('/blocs', false);
    expect(canonique()).toBe('/blocs');
    expect(robots()).toBeNull();
  });

  it('passe en noindex quand la page est filtrée, et redevient indexable sans filtre', () => {
    service.definir('/blocs', true);
    expect(robots()).toBe('noindex, follow');
    service.definir('/blocs', false);
    expect(robots()).toBeNull();
  });

  it('met à jour le canonique au lieu d’en ajouter un second', () => {
    service.definir('/blocs', false);
    service.definir('/composants', false);
    expect(head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(canonique()).toBe('/composants');
  });

  it('retire le canonique et le noindex quand la page se détruit', () => {
    service.definir('/blocs', true);
    service.retirer();
    expect(canonique()).toBeNull();
    expect(robots()).toBeNull();
  });
});
