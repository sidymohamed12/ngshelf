import { Injectable, signal } from '@angular/core';

export interface Notification {
  readonly id: number;
  readonly texte: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private suivant = 0;
  private readonly _liste = signal<readonly Notification[]>([]);
  readonly liste = this._liste.asReadonly();
  readonly duree = 5000;

  afficher(texte: string): void {
    const notification: Notification = { id: this.suivant++, texte };
    this._liste.update((l) => [notification, ...l].slice(0, 3));
    setTimeout(() => this.retirer(notification.id), this.duree);
  }

  retirer(id: number): void {
    this._liste.update((l) => l.filter((n) => n.id !== id));
  }
}
