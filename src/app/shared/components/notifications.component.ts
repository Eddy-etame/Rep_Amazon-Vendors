import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div *ngFor="let notif of notifications" 
           class="notification" 
           [ngClass]="'notification-' + notif.type">
        {{ notif.message }}
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification {
      padding: 12px 16px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .notification-success {
      background: rgba(22, 163, 74, 0.15);
      color: #86efac;
      border-color: rgba(22, 163, 74, 0.4);
    }

    .notification-error {
      background: rgba(220, 38, 38, 0.15);
      color: #fca5a5;
      border-color: rgba(220, 38, 38, 0.4);
    }

    .notification-warning {
      background: rgba(234, 179, 8, 0.14);
      color: #fde68a;
      border-color: rgba(234, 179, 8, 0.4);
    }

    .notification-info {
      background: rgba(249, 115, 22, 0.14);
      color: #fdba74;
      border-color: rgba(249, 115, 22, 0.4);
    }
  `]
})
export class NotificationsComponent {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {
    this.notificationService.notifications.subscribe(notifs => {
      this.notifications = notifs;
    });
  }
}
