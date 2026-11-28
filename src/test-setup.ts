/**
 * Préparation commune des tests : jsdom n'a pas `IntersectionObserver`, que `@defer (on viewport)` des cases
 * de la planche exige. Un observateur inerte évite l'erreur ; les tests qui ont besoin d'en piloter un le
 * remplacent par `vi.stubGlobal`.
 */
class ObservateurInerte {
  observe(): void {
    // Rien à observer : aucune case n'entre jamais dans le viewport en test.
  }
  unobserve(): void {
    // Rien à libérer.
  }
  disconnect(): void {
    // Rien à libérer.
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === 'undefined') {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: ObservateurInerte,
    configurable: true,
    writable: true,
  });
}
