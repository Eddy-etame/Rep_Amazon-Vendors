import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { VendorConversationService } from '../../core/services/vendor-conversation.service';
import { VendorOrdersService } from '../../core/services/vendor-orders.service';
import { VendorProductService } from '../../core/services/vendor-product.service';
import { VendorReturnsService } from '../../core/services/vendor-returns.service';
import { VendorSessionStore } from '../../core/services/vendor-session.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  pendingOrders = 0;
  openReturns = 0;

  constructor(
    private readonly productService: VendorProductService,
    private readonly conversationService: VendorConversationService,
    private readonly ordersService: VendorOrdersService,
    private readonly returnsService: VendorReturnsService,
    private readonly vendorSession: VendorSessionStore
  ) {}

  async ngOnInit(): Promise<void> {
    await this.vendorSession.load();
    this.productService.seedIfEmpty();
    this.conversationService.seedIfEmpty();
    this.ordersService.seedIfEmpty();
    this.returnsService.seedIfEmpty();

    try {
      await this.productService.loadAll();
    } catch {
      /* dashboard still shows other widgets */
    }
    this.products = this.productService.getAll();

    this.pendingOrders = this.ordersService
      .getAll()
      .filter((order) => ['confirmed', 'preparing', 'shipped'].includes(order.status)).length;
    this.openReturns = this.returnsService
      .getAll()
      .filter((request) => ['open', 'approved', 'received'].includes(request.status)).length;
  }

  get activeProductsCount(): number {
    return this.products.filter((p) => p.status !== 'archived').length;
  }

  get lowStockCount(): number {
    return this.products.filter((p) => {
      const threshold = p.lowStockThreshold ?? 5;
      return p.stock > 0 && p.stock <= threshold;
    }).length;
  }

  get unreadMessagesCount(): number {
    return this.conversationService.countUnread();
  }

  get pendingOrdersCount(): number {
    return this.pendingOrders;
  }

  get missingImageCount(): number {
    return this.products.filter((p) => !p.image?.trim()).length;
  }

  get weakDescriptionCount(): number {
    return this.products.filter((p) => (p.description ?? '').trim().length < 40).length;
  }

  get outOfStockCount(): number {
    return this.products.filter((p) => p.stock <= 0).length;
  }

  get healthIssuesCount(): number {
    return this.missingImageCount + this.weakDescriptionCount + this.outOfStockCount;
  }
}
