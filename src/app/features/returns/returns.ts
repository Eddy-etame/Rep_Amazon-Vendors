import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VendorReturnRequest, VendorReturnStatus } from '../../core/models/vendor-return.model';
import { NotificationService } from '../../core/services/notification.service';
import { VendorReturnsService } from '../../core/services/vendor-returns.service';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns.html',
  styleUrl: './returns.scss'
})
export class Returns implements OnInit {
  requests: VendorReturnRequest[] = [];
  selectedRequestId: string | null = null;

  searchQuery = '';
  statusFilter: VendorReturnStatus | 'all' = 'all';

  constructor(
    private readonly returnsService: VendorReturnsService,
    private readonly notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.returnsService.seedIfEmpty();
    this.refresh();
    if (this.requests.length > 0) {
      this.selectedRequestId = this.requests[0].id;
    }
  }

  get filteredRequests(): VendorReturnRequest[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.requests.filter((request) => {
      const matchQ =
        !q ||
        request.id.toLowerCase().includes(q) ||
        request.orderId.toLowerCase().includes(q) ||
        request.userName.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'all' || request.status === this.statusFilter;
      return matchQ && matchStatus;
    });
  }

  get selectedRequest(): VendorReturnRequest | undefined {
    return this.requests.find((request) => request.id === this.selectedRequestId);
  }

  selectRequest(requestId: string): void {
    this.selectedRequestId = requestId;
  }

  updateRequestStatus(status: VendorReturnStatus): void {
    if (!this.selectedRequestId) return;
    const updated = this.returnsService.updateStatus(this.selectedRequestId, status);
    if (!updated) {
      this.notifications.error('Impossible de mettre à jour la demande.');
      return;
    }
    this.notifications.success(`Demande mise à jour: ${status}.`);
    this.refresh();
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private refresh(): void {
    this.requests = this.returnsService.getAll();
  }
}
