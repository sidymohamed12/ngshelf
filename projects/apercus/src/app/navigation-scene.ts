import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Une scène d'aperçu n'est jamais une vraie page : seule la première navigation (celle de l'URL de l'iframe)
 * est permise. Tout clic sur un `routerLink` d'une ressource (navbar, bouton, carte) est annulé ici, au lieu
 * d'envoyer l'aperçu vers la route `**` (« page introuvable »). Les liens `href` simples restent neutralisés
 * par `App.neutraliserLiens`.
 */
export const premiereNavigationSeulement: CanActivateFn = () => !inject(Router).navigated;

/**
 * Un bouton `type="submit"` d'un formulaire d'une ressource recharge la page : on annule la soumission natale
 * dans la scène. Les écouteurs `(ngSubmit)` de la ressource continuent de fonctionner.
 */
export function neutraliserSoumissions(document: Document): () => void {
  const surSoumission = (evenement: Event): void => {
    const cible = evenement.target;
    if (cible instanceof Element && cible.closest('main')) evenement.preventDefault();
  };
  document.addEventListener('submit', surSoumission, { capture: true });
  return () => document.removeEventListener('submit', surSoumission, { capture: true });
}
