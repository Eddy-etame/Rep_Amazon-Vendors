import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VendorOrder, VendorOrderStatus } from '../../core/models/vendor-order.model';
import { NotificationService } from '../../core/services/notification.service';
import { VendorOrdersService } from '../../core/services/vendor-orders.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders implements OnInit {
  orders: VendorOrder[] = [];
  selectedOrderId: string | null = null;

  searchQuery = '';
  statusFilter: VendorOrderStatus | 'all' = 'all';

  constructor(
    private readonly ordersService: VendorOrdersService,
    private readonly notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.ordersService.seedIfEmpty();
    this.refresh();
    if (this.orders.length > 0) {
      this.selectedOrderId = this.orders[0].id;
    }
  }

  get filteredOrders(): VendorOrder[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.orders.filter((order) => {
      const matchQ =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.userName.toLowerCase().includes(q) ||
        order.shippingCity.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'all' || order.status === this.statusFilter;
      return matchQ && matchStatus;
    });
  }

  get selectedOrder(): VendorOrder | undefined {
    return this.orders.find((order) => order.id === this.selectedOrderId);
  }

  selectOrder(orderId: string): void {
    this.selectedOrderId = orderId;
  }

  updateOrderStatus(status: VendorOrderStatus): void {
    if (!this.selectedOrderId) return;
    const updated = this.ordersService.updateStatus(this.selectedOrderId, status);
    if (!updated) {
      this.notifications.error('Impossible de mettre à jour la commande.');
      return;
    }
    this.notifications.success(`Statut commande mis à jour: ${status}.`);
    this.refresh();
  }

  formatDate(timestamp: number | undefined): string {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private refresh(): void {
    this.orders = this.ordersService.getAll();
  }
}
