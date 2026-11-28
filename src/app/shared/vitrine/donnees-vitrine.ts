import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { RegistreService, estVisible } from '@core/registre/registre.service';
import { FicheService } from '@features/ressource/services/fiche.service';
import { EntreeIndex } from '@shared/models/index-catalogue.model';
import { FicheRessource } from '@shared/models/fiche.model';

/**
 * Ressource dont les pages vitrines montrent le vrai code, le vrai zip et les vraies valeurs de design
 * (maquette : « interrupteur »). Un seul endroit pour la changer.
 */
export const RESSOURCE_DEMO = {
  categorie: 'composants',
  type: 'interrupteur',
  slug: 'interrupteur',
} as const;

/**
 * Ce que les pages vitrines tirent du registre : l'index complet (planche, familles) et la fiche de la
 * ressource de démonstration (code, fichiers du zip, valeurs des designs). `null` = ce chargement a échoué :
 * la zone concernée affiche son état d'erreur avec « Réessayer », le reste de la page est intact.
 */
export interface DonneesVitrine {
  readonly entrees: readonly EntreeIndex[] | null;
  readonly fiche: FicheRessource | null;
}

export async function chargerFicheVitrine(fiches: FicheService): Promise<FicheRessource | null> {
  const resultat = await fiches.charger(RESSOURCE_DEMO);
  return resultat.etat === 'ok' ? resultat.fiche : null;
}

export async function chargerEntreesVitrine(
  registre: RegistreService,
): Promise<readonly EntreeIndex[] | null> {
  try {
    return (await registre.toutes()).filter(estVisible);
  } catch {
    return null;
  }
}

export async function chargerDonneesVitrine(
  registre: RegistreService,
  fiches: FicheService,
): Promise<DonneesVitrine> {
  const [entrees, fiche] = await Promise.all([
    chargerEntreesVitrine(registre),
    chargerFicheVitrine(fiches),
  ]);
  return { entrees, fiche };
}

/**
 * Charge les données AVANT l'affichage : le HTML prérendu et le premier rendu du navigateur contiennent
 * déjà la planche et le code (aucun écran de chargement qui change la hauteur de la page). Ne rejette
 * jamais : l'échec devient un état de la zone.
 */
export const donneesVitrineResolver: ResolveFn<DonneesVitrine> = () =>
  chargerDonneesVitrine(inject(RegistreService), inject(FicheService));

/** « À propos » n'a besoin que de la fiche (les compteurs viennent du bundle). */
export const ficheVitrineResolver: ResolveFn<FicheRessource | null> = () =>
  chargerFicheVitrine(inject(FicheService));
