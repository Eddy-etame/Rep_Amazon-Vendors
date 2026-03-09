import { Injectable } from '@angular/core';

import { VendorReturnRequest, VendorReturnStatus } from '../models/vendor-return.model';

const KEY = 'vendor_returns';

@Injectable({ providedIn: 'root' })
export class VendorReturnsService {
  private read(): VendorReturnRequest[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as VendorReturnRequest[];
    } catch {
      return [];
    }
  }

  private write(returns: VendorReturnRequest[]): void {
    localStorage.setItem(KEY, JSON.stringify(returns));
  }

  getAll(): VendorReturnRequest[] {
    return this.read().sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(returnId: string): VendorReturnRequest | undefined {
    return this.read().find((ret) => ret.id === returnId);
  }

  updateStatus(returnId: string, status: VendorReturnStatus): VendorReturnRequest | undefined {
    const returns = this.read();
    const idx = returns.findIndex((ret) => ret.id === returnId);
    if (idx < 0) return undefined;

    const updated: VendorReturnRequest = { ...returns[idx], status };
    returns[idx] = updated;
    this.write(returns);
    return updated;
  }

  seedIfEmpty(): void {
    if (this.read().length > 0) return;

    const now = Date.now();
    const seeded: VendorReturnRequest[] = [
      {
        id: 'ret-9001',
        orderId: 'v-cmd-3003',
        userId: 'usr_noe_003',
        userName: 'Noé',
        reason: 'Article reçu avec une rayure visible sur le côté.',
        qrReference: 'QR-RET-9001',
        createdAt: now - 1000 * 60 * 60 * 20,
        status: 'open',
        items: [{ productId: 'prod-backpack-03', productName: 'Sac à Dos Urban', quantity: 1 }]
      },
      {
        id: 'ret-9002',
        orderId: 'v-cmd-3001',
        userId: 'usr_amy_001',
        userName: 'Amy',
        reason: 'Le casque ne correspond pas à la couleur commandée.',
        qrReference: 'QR-RET-9002',
        createdAt: now - 1000 * 60 * 60 * 6,
        status: 'approved',
        items: [{ productId: 'prod-casque-01', productName: 'Casque Bluetooth Premium', quantity: 1 }]
      }
    ];

    this.write(seeded);
  }
}
