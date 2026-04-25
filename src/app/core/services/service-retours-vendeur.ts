import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { VendorReturnRequest, VendorReturnStatus } from '../models/modele-retour-vendeur';

interface VendorReturnsListResponse {
  data?: {
    items?: VendorReturnDto[];
  };
}

interface VendorReturnDetailResponse {
  data?: VendorReturnDto;
}

interface VendorReturnDto {
  id: string;
  orderId: string;
  userId: string;
  vendorId?: string;
  userName: string;
  reason: string;
  qrReference: string;
  createdAt?: string;
  updatedAt?: string;
  status: VendorReturnStatus;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
}

function toTimestamp(raw: unknown): number {
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeApiError(error: unknown, fallbackMessage: string): Error {
  const message =
    (error as { error?: { error?: { message?: string }; message?: string } })?.error?.error?.message ||
    (error as { error?: { message?: string } })?.error?.message ||
    (error as { message?: string })?.message ||
    fallbackMessage;
  return new Error(message);
}

function mapReturn(dto: VendorReturnDto): VendorReturnRequest {
  return {
    id: String(dto.id || '').trim(),
    orderId: String(dto.orderId || '').trim(),
    userId: String(dto.userId || '').trim(),
    vendorId: dto.vendorId ? String(dto.vendorId) : undefined,
    userName: String(dto.userName || 'Client').trim(),
    reason: String(dto.reason || '').trim(),
    qrReference: String(dto.qrReference || '').trim(),
    createdAt: toTimestamp(dto.createdAt),
    updatedAt: dto.updatedAt ? toTimestamp(dto.updatedAt) : undefined,
    status: dto.status,
    items: Array.isArray(dto.items)
      ? dto.items.map((item) => ({
          productId: String(item.productId || '').trim(),
          productName: String(item.productName || 'Produit').trim(),
          quantity: Math.max(1, Number(item.quantity || 1))
        }))
      : []
  };
}

@Injectable({ providedIn: 'root' })
export class ServiceRetoursVendeur {
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/retours`;
  private requests: VendorReturnRequest[] = [];

  constructor(private readonly http: HttpClient) {}

  getAll(): VendorReturnRequest[] {
    return [...this.requests].sort((a, b) => b.createdAt - a.createdAt);
  }

  getById(returnId: string): VendorReturnRequest | undefined {
    return this.requests.find((request) => request.id === returnId);
  }

  async loadAll(status?: VendorReturnStatus): Promise<VendorReturnRequest[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<VendorReturnsListResponse>(this.baseUrl, {
          params: status ? { status } : undefined
        })
      );
      const items = Array.isArray(response.data?.items) ? response.data.items.map(mapReturn) : [];
      this.requests = items.sort((a, b) => b.createdAt - a.createdAt);
      return this.getAll();
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger les retours vendeur.');
    }
  }

  async loadOne(returnId: string): Promise<VendorReturnRequest | undefined> {
    try {
      const response = await firstValueFrom(
        this.http.get<VendorReturnDetailResponse>(`${this.baseUrl}/${encodeURIComponent(returnId)}`)
      );
      if (!response.data?.id) {
        return undefined;
      }
      const mapped = mapReturn(response.data);
      const next = this.requests.filter((request) => request.id !== mapped.id);
      next.push(mapped);
      this.requests = next.sort((a, b) => b.createdAt - a.createdAt);
      return mapped;
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de charger le retour.');
    }
  }

  async updateStatus(returnId: string, status: VendorReturnStatus): Promise<VendorReturnRequest> {
    try {
      await firstValueFrom(
        this.http.put(`${this.baseUrl}/${encodeURIComponent(returnId)}/statut`, {
          status
        })
      );
      const updated = await this.loadOne(returnId);
      if (!updated) {
        throw new Error('Retour introuvable apres mise a jour.');
      }
      return updated;
    } catch (error) {
      throw normalizeApiError(error, 'Impossible de mettre a jour le retour.');
    }
  }
}
