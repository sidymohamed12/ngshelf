import { DOCUMENT, Service, inject } from '@angular/core';
import { FichierAffiche, FicheRessource, cheminZip } from '@shared/models/fiche.model';
import { VarianteLivree } from '@shared/livraison/livraison';

export type EtatTelechargement = 'repos' | 'encours' | 'fait' | 'erreur';

export interface ContenuLivre {
  readonly fiche: FicheRessource;
  readonly variante: VarianteLivree;
  readonly fichiers: readonly FichierAffiche[];
  readonly tokensCss: string;
  readonly personnalise: boolean;
}

const NOM_TOKENS = 'tokens.css';
const NOM_PONT = 'ngshelf-theme.css';
const DELAI_LIBERATION_URL_MS = 2000;

/** Texte de « Copier le code » : les fichiers de la variante, puis tokens.css (et le pont sous Tailwind). */
export function toutLeCode(contenu: ContenuLivre): string {
  const annexes = [{ nom: NOM_TOKENS, code: contenu.tokensCss }];
  if (contenu.variante === 'tailwind') annexes.push({ nom: NOM_PONT, code: contenu.fiche.pont });
  return [...contenu.fichiers.map((f) => ({ nom: f.nom, code: f.code })), ...annexes]
    .map(
      ({ nom, code }) => `${nom.endsWith('.html') ? `<!-- ${nom} -->` : `/* ${nom} */`}\n${code}`,
    )
    .join('\n\n');
}

/**
 * Téléchargement du zip (navigateur seulement). Sans réglage : le zip standard produit au build, servi
 * statiquement. Avec réglages : assemblé ici, module de zip chargé à la demande, avec le tokens.css réglé.
 */
@Service()
export class LivraisonFicheService {
  readonly #document = inject(DOCUMENT);

  async telecharger(contenu: ContenuLivre): Promise<void> {
    const { slug } = contenu.fiche.meta;
    const blob = contenu.personnalise
      ? await this.#assembler(contenu)
      : await this.#recuperer(cheminZip(slug, contenu.variante));
    this.#declencher(blob, `${slug}-${contenu.variante}.zip`);
  }

  async #recuperer(chemin: string): Promise<Blob> {
    const reponse = await fetch(chemin);
    if (!reponse.ok) throw new Error(`zip injoignable (${reponse.status})`);
    return reponse.blob();
  }

  async #assembler(contenu: ContenuLivre): Promise<Blob> {
    const [{ creerZip }, { genererLicence, genererReadme }] = await Promise.all([
      import('@shared/livraison/zip'),
      import('@shared/livraison/livraison'),
    ]);
    const { meta, usage, pont } = contenu.fiche;
    const dossier = `${meta.slug}-${contenu.variante}`;
    const entrees = [
      ...contenu.fichiers.map((f) => ({ nom: f.nom, contenu: `${f.code}\n` })),
      { nom: NOM_TOKENS, contenu: contenu.tokensCss },
      ...(contenu.variante === 'tailwind' ? [{ nom: NOM_PONT, contenu: pont }] : []),
      {
        nom: 'README.md',
        contenu: genererReadme({
          nomSite: 'NgShelf',
          titre: meta.titre.fr,
          description: meta.description.fr,
          slug: meta.slug,
          variante: contenu.variante,
          angularMin: meta.angularMin,
          dependances: `Aucune : seulement Angular ${meta.angularMin.split('.')[0]}`,
          usage,
        }),
      },
      {
        nom: 'LICENSE',
        contenu: genererLicence(new Date().getFullYear(), 'Les contributeurs de NgShelf'),
      },
    ].map((e) => ({ nom: `${dossier}/${e.nom}`, contenu: e.contenu }));
    return new Blob([creerZip(entrees, new Date()).slice().buffer], { type: 'application/zip' });
  }

  #declencher(blob: Blob, nom: string): void {
    const url = URL.createObjectURL(blob);
    const lien = this.#document.createElement('a');
    lien.href = url;
    lien.download = nom;
    this.#document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), DELAI_LIBERATION_URL_MS);
  }
}
