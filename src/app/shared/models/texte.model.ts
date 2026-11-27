/** Texte visible d'une ressource, au format `{ fr, en? }` dès la v1 (ADR 0004). */
export interface Texte {
  readonly fr: string;
  readonly en?: string;
}
