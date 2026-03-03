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
           [ngClass]="'notification-' + notif.type"
           [@slideIn]>
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
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: slideInRight 0.3s;
      font-size: 14px;
      font-weight: 500;
    }

    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .notification-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .notification-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .notification-warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
    }

    .notification-info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
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
