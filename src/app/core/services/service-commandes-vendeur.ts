import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { VendorOrder, VendorOrderItem, VendorOrderStatus } from '../models/modele-commande-vendeur';

interface VendorOrdersListResponse {
  data?: {
    items?: VendorOrderDto[];
  };
}

interface VendorOrderDetailResponse {
  data?: VendorOrderDto;
}

interface VendorOrderDto {
  id: string;
  userId: string;
  userName: string;
  status: VendorOrderStatus;
  total: number;
  currency?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string | null;
  shippingCity?: string;
  shippingAddressText?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: VendorOrderItemDto[];
}

interface VendorOrderItemDto {
  productId: string;
  productName?: string;
  title?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  image?: string;
}

function toTimestamp(raw: unknown): number {
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizePaymentMethod(raw: unknown): string {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return 'Carte';
  if (value === 'card') return 'Carte';
  if (value === 'bank_transfer') return 'Virement';
  if (value === 'paypal') return 'PayPal';
  return String(raw);
}

function normalizeApiError(error: unknown, fallbackMessage: string): Error {
  const message =
    (error as { error?: { error?: { message?: string }; message?: string } })?.error?.error?.message ||
    (error as { error?: { message?: string } })?.error?.message ||
    (error as { message?: string })?.message ||
    fallbackMessage;
  return new Error(message);
}

function mapOrderItem(dto: VendorOrderItemDto): VendorOrderItem {
  return {
    productId: String(dto.productId || '').trim(),
    productName: String(dto.productName || dto.title || 'Produit').trim(),
    quantity: Math.max(1, Number(dto.quantity || 1)),
    unitPrice: Number(dto.unitPrice ?? dto.price ?? 0),
    image: dto.image ? String(dto.image) : undefined
  };
}

function mapOrder(dto: VendorOrderDto): VendorOrder {
  return {
    id: String(dto.id || '').trim(),
    userId: String(dto.userId || '').trim(),
    userName: String(dto.userName || 'Client').trim(),
    createdAt: toTimestamp(dto.createdAt),
    updatedAt: dto.updatedAt ? toTimestamp(dto.updatedAt) : undefined,
    status: dto.status,
    estimatedDeliveryAt: toTimestamp(dto.estimatedDeliveryAt),
    deliveredAt: dto.deliveredAt ? toTimestamp(dto.deliveredAt) : undefined,
    total: Number(dto.total || 0),
    currency: String(dto.currency || 'EUR'),
    items: Array.isArray(dto.items) ? dto.items.map(mapOrderItem) : [],
    shippingCity: String(dto.shippingCity || '').trim(),
    shippingAddress: String(dto.shippingAddressText || '').trim(),
    paymentMethod: normalizePaymentMethod(dto.paymentMethod),
    paymentStatus: dto.paymentStatus ? String(dto.paymentStatus) : undefined
  };
}

@Injectable({ providedIn: 'root' })
export class ServiceCommandesVendeur {
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/commandes`;
  private orders: VendorOrder[] = [];

  constructor(private readonly http: HttpClient) {}

  getAll(): VendorOrder[] {
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(orderId: string): VendorOrder | undefined {
    return this.orders.find((order) => order.id === orderId);
  }

  async loadAll(status?: VendorOrderStatus): Promise<VendorOrder[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<VendorOrdersListResponse>(this.baseUrl, {
          params: status ? { status } : undefined
        })
      );
      const items = Array.isArray(response.data?.items) ? response.data.items.map(mapOrder) : [];
      this.orders = items.sort((a, b) => b.createdAt - a.createdAt);
      return this.getAll();
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger les commandes vendeur.');
    }
  }

  async loadOne(orderId: string): Promise<VendorOrder | undefined> {
    try {
      const response = await firstValueFrom(
        this.http.get<VendorOrderDetailResponse>(`${this.baseUrl}/${encodeURIComponent(orderId)}`)
      );
      if (!response.data?.id) {
        return undefined;
      }
      const mapped = mapOrder(response.data);
      const next = this.orders.filter((order) => order.id !== mapped.id);
      next.push(mapped);
      this.orders = next.sort((a, b) => b.createdAt - a.createdAt);
      return mapped;
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger la commande.');
    }
  }

  async updateStatus(orderId: string, status: VendorOrderStatus): Promise<VendorOrder> {
    try {
      await firstValueFrom(
        this.http.put(`${this.baseUrl}/${encodeURIComponent(orderId)}/statut`, {
          status
        })
      );
      const updated = await this.loadOne(orderId);
      if (!updated) {
        throw new Error('Commande introuvable apres mise a jour.');
      }
      return updated;
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de mettre a jour la commande.');
    }
  }
}
