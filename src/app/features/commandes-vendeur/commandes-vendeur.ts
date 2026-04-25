import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { VendorOrder, VendorOrderStatus } from '../../core/models/modele-commande-vendeur';
import { ServiceNotification } from '../../core/services/service-notification';
import { ServiceCommandesVendeur } from '../../core/services/service-commandes-vendeur';
import { PipeLibelleStatut } from '../../shared/pipes/pipe-libelle-statut';

@Component({
  selector: 'app-commandes-vendeur',
  standalone: true,
  imports: [CommonModule, FormsModule, PipeLibelleStatut],
  templateUrl: './commandes-vendeur.html',
  styleUrl: './commandes-vendeur.scss'
})
export class CommandesVendeur implements OnInit {
  orders: VendorOrder[] = [];
  selectedOrderId: string | null = null;
  loading = false;
  loadError: string | null = null;
  updatePending = false;

  searchQuery = '';
  statusFilter: VendorOrderStatus | 'all' | 'in_progress' = 'all';

  constructor(
    private readonly ordersService: ServiceCommandesVendeur,
    private readonly notifications: ServiceNotification,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.searchQuery = params.get('q') ?? '';
    this.statusFilter = (params.get('status') as VendorOrderStatus | 'all' | 'in_progress' | null) ?? 'all';
    await this.refresh(false);
  }

  get filteredOrders(): VendorOrder[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.orders.filter((order) => {
      const matchQ =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.userName.toLowerCase().includes(q) ||
        order.shippingCity.toLowerCase().includes(q);
      const matchStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'in_progress' && ['confirmed', 'preparing', 'shipped'].includes(order.status)) ||
        order.status === this.statusFilter;
      return matchQ && matchStatus;
    });
  }

  get selectedOrder(): VendorOrder | undefined {
    return this.orders.find((order) => order.id === this.selectedOrderId);
  }

  selectOrder(orderId: string): void {
    this.selectedOrderId = orderId;
  }

  async updateOrderStatus(status: VendorOrderStatus): Promise<void> {
    if (!this.selectedOrderId) return;
    this.updatePending = true;
    try {
      const updated = await this.ordersService.updateStatus(this.selectedOrderId, status);
      this.notifications.success(`Statut commande mis a jour: ${status}.`);
      await this.refresh(true, updated.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible de mettre à jour la commande.';
      this.notifications.error(msg);
    } finally {
      this.updatePending = false;
      this.syncView();
    }
  }

  formatDate(timestamp: number | undefined): string {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private async refresh(preserveSelection: boolean, preferredSelectionId?: string): Promise<void> {
    const previousSelectionId = preserveSelection ? this.selectedOrderId : null;
    this.loading = true;
    this.loadError = null;
    try {
      this.orders = await this.ordersService.loadAll();
    } catch (e) {
      this.orders = this.ordersService.getAll();
      this.loadError = e instanceof Error ? e.message : 'Impossible de charger les commandes.';
      if (this.orders.length === 0) {
        this.notifications.error(this.loadError);
      }
    } finally {
      this.loading = false;
    }

    const nextSelectionId = preferredSelectionId || previousSelectionId;
    if (nextSelectionId && this.orders.some((order) => order.id === nextSelectionId)) {
      this.selectedOrderId = nextSelectionId;
      this.syncView();
      return;
    }
    this.selectedOrderId = this.orders[0]?.id ?? null;
    this.syncView();
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
