import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorProductService } from '../../core/services/vendor-product.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
})
export class Products implements OnInit {
  products: Product[] = [];
  loading = false;

  constructor(
    private vendorProductService: VendorProductService,
    private confirmDialog: ConfirmDialogService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.vendorProductService.seedIfEmpty();
    this.refresh();
  }

  refresh(): void {
    this.products = this.vendorProductService.getAll();
  }

  async delete(id: number, productName: string): Promise<void> {
    const result = await this.confirmDialog.openDialog(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${productName}" ? Cette action est irréversible.`
    );

    if (result) {
      this.vendorProductService.remove(id);
      this.refresh();
      this.notificationService.success(`"${productName}" a été supprimé.`);
    }
  }
}
