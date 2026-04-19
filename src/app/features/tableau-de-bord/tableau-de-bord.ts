import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../core/models/modele-produit';
import { ServiceJetonAuthVendeur } from '../../core/services/service-jeton-auth-vendeur';
import { ServiceConversationVendeur } from '../../core/services/service-conversation-vendeur';
import { ServiceCommandesVendeur } from '../../core/services/service-commandes-vendeur';
import { ServiceProduitVendeur } from '../../core/services/service-produit-vendeur';
import { ServiceRetoursVendeur } from '../../core/services/service-retours-vendeur';
import { DepotSessionVendeur } from '../../core/services/depot-session-vendeur';
import { ServiceNotification } from '../../core/services/service-notification';

@Component({
  selector: 'app-tableau-de-bord',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss'
})
export class TableauDeBord implements OnInit {
  products: Product[] = [];
  pendingOrders = 0;
  openReturns = 0;
  unreadMessages = 0;
  dashboardLoading = false;
  sessionProfileMissing = false;
  productsLoadError: string | null = null;
  ordersLoadError: string | null = null;
  returnsLoadError: string | null = null;
  messagesLoadError: string | null = null;

  constructor(
    private readonly productService: ServiceProduitVendeur,
    private readonly conversationService: ServiceConversationVendeur,
    private readonly ordersService: ServiceCommandesVendeur,
    private readonly returnsService: ServiceRetoursVendeur,
    private readonly vendorSession: DepotSessionVendeur,
    private readonly tokenService: ServiceJetonAuthVendeur,
    private readonly notifications: ServiceNotification,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.dashboardLoading = true;
    await this.vendorSession.load();
    const hasToken = !!this.tokenService.getToken() && !this.tokenService.isTokenExpired();
    this.sessionProfileMissing = hasToken && !this.vendorSession.vendorId;
    if (this.sessionProfileMissing) {
      this.notifications.warning(
        'Profil vendeur introuvable. Vérifiez que l\'API répond, que vous êtes bien connecté en tant que vendeur, puis reconnectez-vous.'
      );
    }

    await Promise.all([
      this.loadProducts(),
      this.loadOrders(),
      this.loadReturns(),
      this.loadMessages()
    ]);
    this.dashboardLoading = false;
    this.syncView();
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
    return this.unreadMessages;
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

  private async loadProducts(): Promise<void> {
    this.productsLoadError = null;
    try {
      await this.productService.loadAll();
      this.products = this.productService.getAll();
    } catch (e) {
      this.products = this.productService.getAll();
      this.productsLoadError = e instanceof Error ? e.message : 'Impossible de charger le catalogue vendeur.';
    }
  }

  private async loadOrders(): Promise<void> {
    this.ordersLoadError = null;
    try {
      const orders = await this.ordersService.loadAll();
      this.pendingOrders = orders.filter((order) => ['confirmed', 'preparing', 'shipped'].includes(order.status)).length;
    } catch (e) {
      this.pendingOrders = 0;
      this.ordersLoadError = e instanceof Error ? e.message : 'Impossible de charger les commandes vendeur.';
    }
  }

  private async loadReturns(): Promise<void> {
    this.returnsLoadError = null;
    try {
      const requests = await this.returnsService.loadAll();
      this.openReturns = requests.filter((request) => ['open', 'approved', 'received'].includes(request.status)).length;
    } catch (e) {
      this.openReturns = 0;
      this.returnsLoadError = e instanceof Error ? e.message : 'Impossible de charger les retours vendeur.';
    }
  }

  private async loadMessages(): Promise<void> {
    this.messagesLoadError = null;
    try {
      await this.conversationService.loadAll();
      this.unreadMessages = this.conversationService.countUnread();
    } catch (e) {
      this.unreadMessages = 0;
      this.messagesLoadError = e instanceof Error ? e.message : 'Impossible de charger la messagerie vendeur.';
    }
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }
}
