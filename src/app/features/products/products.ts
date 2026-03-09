import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorProductService } from '../../core/services/vendor-product.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { Product, ProductStatus } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
})
export class Products implements OnInit {
  products: Product[] = [];
  categories: string[] = [];

  searchQuery = '';
  statusFilter: ProductStatus | 'all' = 'all';
  stockFilter: 'all' | 'low' | 'out' = 'all';
  categoryFilter = '';
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc' = 'recent';

  selectedIds = new Set<number>();

  constructor(
    private vendorProductService: VendorProductService,
    private confirmDialog: ConfirmDialogService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.vendorProductService.seedIfEmpty();
    this.categories = this.vendorProductService.listCategories();
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

  isSelected(productId: number): boolean {
    return this.selectedIds.has(productId);
  }

  toggleSelectOne(productId: number, checked: boolean): void {
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

  applyStatusToSelection(status: ProductStatus): void {
    if (!this.hasSelection) return;
    this.vendorProductService.updateStatus([...this.selectedIds], status);
    this.notificationService.success('Statut mis à jour.');
    this.refresh();
  }

  increaseStockSelection(): void {
    if (!this.hasSelection) return;
    this.vendorProductService.adjustStock([...this.selectedIds], 5);
    this.notificationService.success('Stock augmenté (+5).');
    this.refresh();
  }

  applyDiscountSelection(): void {
    if (!this.hasSelection) return;
    this.vendorProductService.adjustPricePercent([...this.selectedIds], -10);
    this.notificationService.success('Remise de 10% appliquée.');
    this.refresh();
  }

  async delete(id: number, productName: string): Promise<void> {
    const result = await this.confirmDialog.openDialog(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${productName}" ? Cette action est irréversible.`
    );

    if (result) {
      this.vendorProductService.remove(id);
      this.refresh();
      this.selectedIds.delete(id);
      this.notificationService.success(`"${productName}" a été supprimé.`);
    }
  }
}
