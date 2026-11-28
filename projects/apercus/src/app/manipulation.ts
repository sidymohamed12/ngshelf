import { MessageManipulation, messageManipulation } from '@shared/apercu/protocole';

/** Classe posée sur `<html>` tant que la case a la main : le CSS rend alors le défilement à l'aperçu. */
export const CLASSE_ACTIF = 'ap-actif';

export interface OptionsManipulation {
  readonly fenetre: Window;
  /** Appelé à chaque prise ou remise de la main, pour que le site le sache. */
  readonly annoncer: (message: MessageManipulation) => void;
  /** Appelé aussi, pour l'état réactif de l'application. */
  readonly surChangement?: (actif: boolean) => void;
}

/**
 * Aperçu d'une case de la planche (ADR 0017). Tout ce qui est pointeur (clic, glisser, survol) marche d'emblée.
 * La molette et le clavier, eux, appartiennent à la page tant que le visiteur n'a pas cliqué ou activé
 * l'aperçu : sans cela, une ressource qui prend la molette ou un défilement épinglé piégerait la page dès que
 * la souris passe sur la case.
 *
 * - Prise de la main : l'iframe reçoit le focus (clic dans l'aperçu, ou le bouton « Manipuler » du site).
 * - Remise : Échap (le site reprend alors le focus), ou le focus qui part ailleurs (clic en dehors, Tab hors
 *   de l'aperçu, fenêtre inactive).
 * - Tant que la main n'est pas prise, un écouteur de capture coupe la molette avant les écouteurs de la
 *   ressource ; la page de l'aperçu n'est pas défilable, donc le défilement remonte à la page du site.
 *
 * Retourne la fonction qui retire les écouteurs.
 */
export function suivreManipulation({
  fenetre,
  annoncer,
  surChangement,
}: OptionsManipulation): () => void {
  const document = fenetre.document;
  const racine = document.documentElement;
  let actif = false;

  const poser = (valeur: boolean, echap: boolean): void => {
    if (actif === valeur) return;
    actif = valeur;
    racine.classList.toggle(CLASSE_ACTIF, valeur);
    if (!valeur) fenetre.scrollTo(0, 0);
    surChangement?.(valeur);
    annoncer(messageManipulation(valeur, echap));
  };

  const prendre = (): void => poser(true, false);
  const rendre = (): void => poser(false, false);
  const surTouche = (evenement: KeyboardEvent): void => {
    // Échap déjà utilisé par la ressource (fermer sa visionneuse, son menu) : on ne rend pas la main en plus.
    if (evenement.key !== 'Escape' || evenement.defaultPrevented || !actif) return;
    poser(false, true);
  };
  const surMolette = (evenement: Event): void => {
    if (!actif) evenement.stopImmediatePropagation();
  };

  fenetre.addEventListener('focus', prendre);
  fenetre.addEventListener('pointerdown', prendre, { capture: true });
  fenetre.addEventListener('blur', rendre);
  fenetre.addEventListener('wheel', surMolette, { capture: true, passive: true });
  document.addEventListener('keydown', surTouche);

  return () => {
    fenetre.removeEventListener('focus', prendre);
    fenetre.removeEventListener('pointerdown', prendre, { capture: true });
    fenetre.removeEventListener('blur', rendre);
    fenetre.removeEventListener('wheel', surMolette, { capture: true });
    document.removeEventListener('keydown', surTouche);
    racine.classList.remove(CLASSE_ACTIF);
  };
}
