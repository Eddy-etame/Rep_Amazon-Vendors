import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorProductService } from '../../core/services/vendor-product.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { Product, ProductStatus } from '../../core/models/product.model';
import { VendorSessionStore } from '../../core/services/vendor-session.store';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class Products implements OnInit {
  products: Product[] = [];
  categories: string[] = [];
  loading = false;

  searchQuery = '';
  statusFilter: ProductStatus | 'all' = 'all';
  stockFilter: 'all' | 'low' | 'out' = 'all';
  categoryFilter = '';
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc' = 'recent';

  selectedIds = new Set<string>();

  constructor(
    private vendorProductService: VendorProductService,
    private confirmDialog: ConfirmDialogService,
    private notificationService: NotificationService,
    private vendorSession: VendorSessionStore
  ) {}

  async ngOnInit(): Promise<void> {
    this.vendorProductService.seedIfEmpty();
    await this.vendorSession.load();
    await this.reloadFromApi();
  }

  private async reloadFromApi(): Promise<void> {
    this.loading = true;
    try {
      await this.vendorProductService.loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger le catalogue';
      this.notificationService.error(msg);
    } finally {
      this.loading = false;
    }
    this.refresh();
  }

  refresh(): void {
    this.categories = this.vendorProductService.listCategories();
    this.products = this.vendorProductService.getFiltered({
      q: this.searchQuery,
      category: this.categoryFilter || undefined,
      status: this.statusFilter,
      stock: this.stockFilter,
      sort: this.sortBy
    });
    this.selectedIds = new Set([...this.selectedIds].filter((id) => this.products.some((p) => p.id === id)));
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }

  get allSelectedOnPage(): boolean {
    return this.products.length > 0 && this.products.every((p) => this.selectedIds.has(p.id));
  }

  isLowStock(product: Product): boolean {
    return product.stock > 0 && product.stock <= product.lowStockThreshold;
  }

  isSelected(productId: string): boolean {
    return this.selectedIds.has(productId);
  }

  toggleSelectOne(productId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(productId);
    } else {
      this.selectedIds.delete(productId);
    }
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.products.forEach((p) => this.selectedIds.add(p.id));
      return;
    }
    this.products.forEach((p) => this.selectedIds.delete(p.id));
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  async applyStatusToSelection(status: ProductStatus): Promise<void> {
    if (!this.hasSelection) return;
    try {
      await this.vendorProductService.updateStatus([...this.selectedIds], status);
      this.notificationService.success('Statut mis à jour.');
      await this.reloadFromApi();
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async increaseStockSelection(): Promise<void> {
    if (!this.hasSelection) return;
    try {
      await this.vendorProductService.adjustStock([...this.selectedIds], 5);
      this.notificationService.success('Stock augmenté (+5).');
      await this.reloadFromApi();
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  async applyDiscountSelection(): Promise<void> {
    if (!this.hasSelection) return;
    try {
      await this.vendorProductService.adjustPricePercent([...this.selectedIds], -10);
      this.notificationService.success('Remise de 10% appliquée.');
      await this.reloadFromApi();
    } catch (e) {
      this.handleWriteError(e);
    }
  }

  private handleWriteError(e: unknown): void {
    const msg = e instanceof Error ? e.message : 'Action impossible';
    if (msg.includes('VENDOR_PENDING') || msg.includes('approbation')) {
      this.notificationService.error('Compte en attente d’approbation : vous ne pouvez pas modifier le catalogue.');
      return;
    }
    if (msg.includes('VENDOR_REJECTED') || msg.includes('refusé')) {
      this.notificationService.error('Compte vendeur refusé.');
      return;
    }
    this.notificationService.error(msg);
  }

  async delete(id: string, productName: string): Promise<void> {
    const result = await this.confirmDialog.openDialog(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${productName}" ? Cette action est irréversible.`
    );

    if (result) {
      try {
        await this.vendorProductService.remove(id);
        this.selectedIds.delete(id);
        await this.reloadFromApi();
        this.notificationService.success(`"${productName}" a été supprimé.`);
      } catch (e) {
        this.handleWriteError(e);
      }
    }
  }
}
