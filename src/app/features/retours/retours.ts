import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { VendorReturnRequest, VendorReturnStatus } from '../../core/models/modele-retour-vendeur';
import { ServiceNotification } from '../../core/services/service-notification';
import { ServiceRetoursVendeur } from '../../core/services/service-retours-vendeur';
import { PipeLibelleStatut } from '../../shared/pipes/pipe-libelle-statut';

@Component({
  selector: 'app-retours',
  standalone: true,
  imports: [CommonModule, FormsModule, PipeLibelleStatut],
  templateUrl: './retours.html',
  styleUrl: './retours.scss'
})
export class Retours implements OnInit {
  requests: VendorReturnRequest[] = [];
  selectedRequestId: string | null = null;
  loading = false;
  loadError: string | null = null;
  updatePending = false;

  searchQuery = '';
  statusFilter: VendorReturnStatus | 'all' | 'active' = 'all';

  constructor(
    private readonly returnsService: ServiceRetoursVendeur,
    private readonly notifications: ServiceNotification,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.searchQuery = params.get('q') ?? '';
    this.statusFilter = (params.get('status') as VendorReturnStatus | 'all' | 'active' | null) ?? 'all';
    await this.refresh(false);
  }

  get filteredRequests(): VendorReturnRequest[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.requests.filter((request) => {
      const matchQ =
        !q ||
        request.id.toLowerCase().includes(q) ||
        request.orderId.toLowerCase().includes(q) ||
        request.userName.toLowerCase().includes(q);
      const matchStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && ['open', 'approved', 'received'].includes(request.status)) ||
        request.status === this.statusFilter;
      return matchQ && matchStatus;
    });
  }

  get selectedRequest(): VendorReturnRequest | undefined {
    return this.requests.find((request) => request.id === this.selectedRequestId);
  }

  selectRequest(requestId: string): void {
    this.selectedRequestId = requestId;
  }

  async updateRequestStatus(status: VendorReturnStatus): Promise<void> {
    if (!this.selectedRequestId) return;
    this.updatePending = true;
    try {
      const updated = await this.returnsService.updateStatus(this.selectedRequestId, status);
      this.notifications.success(`Demande mise a jour: ${status}.`);
      await this.refresh(true, updated.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible de mettre à jour la demande.';
      this.notifications.error(msg);
    } finally {
      this.updatePending = false;
      this.syncView();
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private async refresh(preserveSelection: boolean, preferredSelectionId?: string): Promise<void> {
    const previousSelectionId = preserveSelection ? this.selectedRequestId : null;
    this.loading = true;
    this.loadError = null;
    try {
      this.requests = await this.returnsService.loadAll();
    } catch (e) {
      this.requests = this.returnsService.getAll();
      this.loadError = e instanceof Error ? e.message : 'Impossible de charger les retours.';
      if (this.requests.length === 0) {
        this.notifications.error(this.loadError);
      }
    } finally {
      this.loading = false;
    }

    const nextSelectionId = preferredSelectionId || previousSelectionId;
    if (nextSelectionId && this.requests.some((request) => request.id === nextSelectionId)) {
      this.selectedRequestId = nextSelectionId;
      this.syncView();
      return;
    }
    this.selectedRequestId = this.requests[0]?.id ?? null;
    this.syncView();
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
