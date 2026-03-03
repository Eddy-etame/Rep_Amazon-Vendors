import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  public notifications: Observable<Notification[]> = this.notifications$.asObservable();

  private idCounter = 0;

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 3000): void {
    const id = `notif-${++this.idCounter}`;
    const notification: Notification = { id, type, message, duration };

    const current = this.notifications$.value;
    this.notifications$.next([...current, notification]);

    if (duration > 0) {
      setTimeout(() => {
        const updated = this.notifications$.value.filter(n => n.id !== id);
        this.notifications$.next(updated);
      }, duration);
    }
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  clear(): void {
    this.notifications$.next([]);
  }
}
