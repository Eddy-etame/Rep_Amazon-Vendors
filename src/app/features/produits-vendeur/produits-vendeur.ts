import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ServiceProduitVendeur } from '../../core/services/service-produit-vendeur';
import { ServiceDialogueConfirmation } from '../../core/services/service-dialogue-confirmation';
import { ServiceNotification } from '../../core/services/service-notification';
import { FormsModule } from '@angular/forms';
import { Product, ProductStatus } from '../../core/models/modele-produit';
import { DepotSessionVendeur } from '../../core/services/depot-session-vendeur';

@Component({
  selector: 'app-produits-vendeur',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './produits-vendeur.html',
  styleUrls: ['./produits-vendeur.scss']
})
export class ProduitsVendeur implements OnInit {
  products: Product[] = [];
  categories: string[] = [];
  loading = false;
  loadError: string | null = null;

  searchQuery = '';
  statusFilter: ProductStatus | 'all' = 'all';
  stockFilter: 'all' | 'low' | 'out' = 'all';
  categoryFilter = '';
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc' = 'recent';

  selectedIds = new Set<string>();

  constructor(
    private vendorProductService: ServiceProduitVendeur,
    private confirmDialog: ServiceDialogueConfirmation,
    private notificationService: ServiceNotification,
    private vendorSession: DepotSessionVendeur,
    private route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.searchQuery = params.get('q') ?? '';
    this.statusFilter = (params.get('status') as ProductStatus | 'all' | null) ?? 'all';
    this.stockFilter = (params.get('stock') as 'all' | 'low' | 'out' | null) ?? 'all';
    this.categoryFilter = params.get('category') ?? '';
    await this.vendorSession.load();
    await this.reloadFromApi();
  }

  private async reloadFromApi(): Promise<void> {
    this.loading = true;
    this.loadError = null;
    try {
      await this.vendorProductService.loadAll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger le catalogue';
      this.loadError = msg;
      this.notificationService.error(msg);
    } finally {
      this.loading = false;
    }
    this.refresh();
    this.syncView();
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
      this.notificationService.error('Compte en attente d\'approbation : vous ne pouvez pas modifier le catalogue.');
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

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
