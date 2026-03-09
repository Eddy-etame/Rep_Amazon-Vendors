import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="dialogService.dialogOpen" (click)="onCancel()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-header">
          <h3>{{ dialogService.title }}</h3>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>
        <div class="confirm-body">
          <p>{{ dialogService.message }}</p>
        </div>
        <div class="confirm-footer">
          <button class="btn btn-secondary" (click)="onCancel()">Annuler</button>
          <button class="btn btn-danger" (click)="onConfirm()">Confirmer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirm-dialog {
      background: #020617;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      animation: slideIn 0.3s;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .confirm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      background: #0f172a;
    }

    .confirm-header h3 {
      margin: 0;
      color: #f9fafb;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #94a3b8;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    }

    .close-btn:hover {
      color: #cbd5e1;
    }

    .confirm-body {
      padding: 20px 16px;
      color: #e2e8f0;
    }

    .confirm-footer {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      justify-content: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid #64748b;
      color: #e2e8f0;
    }

    .btn-secondary:hover {
      border-color: #f97316;
      color: #f97316;
    }

    .btn-danger {
      background: #f97316;
      color: #111827;
    }

    .btn-danger:hover {
      background: #ea580c;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(public dialogService: ConfirmDialogService) {}

  onConfirm(): void {
    this.dialogService.confirm();
  }

  onCancel(): void {
    this.dialogService.cancel();
  }
}
