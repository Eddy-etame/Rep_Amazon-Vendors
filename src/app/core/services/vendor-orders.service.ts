import { Injectable } from '@angular/core';

import { VendorOrder, VendorOrderItem, VendorOrderStatus } from '../models/vendor-order.model';

/**
 * Mock/demo orders service using localStorage.
 * Replace with real API calls when backend vendor orders endpoints exist.
 */
const KEY = 'vendor_orders';

@Injectable({ providedIn: 'root' })
export class VendorOrdersService {
  private readonly deliveryMinDays = 3;
  private readonly deliveryMaxDays = 7;

  private read(): VendorOrder[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as VendorOrder[];
    } catch {
      return [];
    }
  }

  private write(orders: VendorOrder[]): void {
    localStorage.setItem(KEY, JSON.stringify(orders));
  }

  getAll(): VendorOrder[] {
    return this.read().sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(orderId: string): VendorOrder | undefined {
    return this.read().find((order) => order.id === orderId);
  }

  updateStatus(orderId: string, status: VendorOrderStatus): VendorOrder | undefined {
    const orders = this.read();
    const idx = orders.findIndex((order) => order.id === orderId);
    if (idx < 0) return undefined;

    const updated: VendorOrder = {
      ...orders[idx],
      status,
      deliveredAt: status === 'delivered' ? Date.now() : orders[idx].deliveredAt
    };
    orders[idx] = updated;
    this.write(orders);
    return updated;
  }

  private buildOrderItem(
    productId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    image?: string
  ): VendorOrderItem {
    return { productId, productName, quantity, unitPrice, image };
  }

  private estimateDelivery(createdAt: number): number {
    const days =
      this.deliveryMinDays +
      Math.floor(Math.random() * (this.deliveryMaxDays - this.deliveryMinDays + 1));
    return createdAt + days * 24 * 60 * 60 * 1000;
  }

  seedIfEmpty(): void {
    if (this.read().length > 0) return;

    const now = Date.now();
    const seedOrders: VendorOrder[] = [
      {
        id: 'v-cmd-3001',
        userId: 'usr_amy_001',
        userName: 'Amy',
        createdAt: now - 1000 * 60 * 60 * 24,
        status: 'confirmed',
        estimatedDeliveryAt: this.estimateDelivery(now - 1000 * 60 * 60 * 24),
        total: 89.99,
        shippingCity: 'Paris',
        shippingAddress: '12 avenue des Fleurs, 75001 Paris',
        paymentMethod: 'Carte',
        items: [
          this.buildOrderItem(
            'prod-casque-01',
            'Casque Bluetooth Premium',
            1,
            89.99,
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'
          )
        ]
      },
      {
        id: 'v-cmd-3002',
        userId: 'usr_lina_002',
        userName: 'Lina',
        createdAt: now - 1000 * 60 * 60 * 40,
        status: 'shipped',
        estimatedDeliveryAt: this.estimateDelivery(now - 1000 * 60 * 60 * 40),
        total: 199.99,
        shippingCity: 'Lyon',
        shippingAddress: '18 rue Victor Hugo, 69002 Lyon',
        paymentMethod: 'Carte',
        items: [
          this.buildOrderItem(
            'prod-watch-02',
            'Montre Connectée Sport',
            1,
            199.99,
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
          )
        ]
      },
      {
        id: 'v-cmd-3003',
        userId: 'usr_noe_003',
        userName: 'Noé',
        createdAt: now - 1000 * 60 * 60 * 24 * 8,
        status: 'delivered',
        estimatedDeliveryAt: this.estimateDelivery(now - 1000 * 60 * 60 * 24 * 8),
        deliveredAt: now - 1000 * 60 * 60 * 24 * 3,
        total: 119.98,
        shippingCity: 'Marseille',
        shippingAddress: '4 boulevard de la Mer, 13008 Marseille',
        paymentMethod: 'Carte',
        items: [
          this.buildOrderItem(
            'prod-backpack-03',
            'Sac à Dos Urban',
            2,
            59.99,
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
          )
        ]
      }
    ];

    this.write(seedOrders);
  }
}
