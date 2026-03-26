import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Product, ProductStatus } from '../models/product.model';
import { VendorSessionStore } from './vendor-session.store';

export interface VendorProductFilters {
  q?: string;
  category?: string;
  status?: ProductStatus | 'all';
  stock?: 'all' | 'low' | 'out';
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc';
}

@Injectable({ providedIn: 'root' })
export class VendorProductService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(VendorSessionStore);
  private cache: Product[] = [];
  private readonly base = environment.apiBaseUrl.replace(/\/+$/, '');

  /** Phase 2: catalog is API-backed; local seed removed */
  seedIfEmpty(): void {
    /* no-op */
  }

  private parseTs(iso: string | Date | undefined): number {
    if (iso instanceof Date) return iso.getTime();
    if (!iso) return Date.now();
    const t = Date.parse(String(iso));
    return Number.isFinite(t) ? t : Date.now();
  }

  private mapApiToProduct(raw: Record<string, unknown>): Product {
    const statusRaw = raw['status'];
    const status: ProductStatus =
      statusRaw === 'draft' || statusRaw === 'archived' || statusRaw === 'published' ? statusRaw : 'published';
    const galleryInput = raw['gallery'];
    const gallery = Array.isArray(galleryInput)
      ? [...new Set(galleryInput.filter((g): g is string => typeof g === 'string' && g.trim() !== ''))]
      : [];
    return {
      id: String(raw['id'] ?? ''),
      sku: String(raw['sku'] ?? ''),
      name: String(raw['title'] ?? raw['titre'] ?? 'Produit sans nom'),
      price: Number(raw['price'] ?? raw['prix'] ?? 0),
      description: String(raw['description'] ?? ''),
      image: String(raw['image'] ?? raw['imagePrincipale'] ?? ''),
      gallery,
      stock: Number(raw['stock'] ?? 0),
      lowStockThreshold: Number(raw['lowStockThreshold'] ?? 5),
      category: String(raw['category'] ?? raw['categorie'] ?? 'Divers'),
      status,
      createdAt: this.parseTs(raw['createdAt'] as string | undefined),
      updatedAt: this.parseTs(raw['updatedAt'] as string | undefined)
    };
  }

  private toCreateBody(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
    return {
      title: data.name,
      price: data.price,
      description: data.description,
      shortDescription: data.description.slice(0, 500),
      detailedDescription: data.description,
      category: data.category,
      city: '',
      stock: data.stock,
      sku: data.sku,
      lowStockThreshold: data.lowStockThreshold,
      image: data.image,
      gallery: data.gallery,
      status: data.status
    };
  }

  private apiErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { error?: { message?: string; code?: string } };
      return body?.error?.message || err.message || 'Erreur réseau';
    }
    return 'Erreur inattendue';
  }

  async loadAll(): Promise<Product[]> {
    const vendorId = this.session.vendorId;
    if (!vendorId) {
      this.cache = [];
      return [];
    }
    const params = new HttpParams()
      .set('vendorId', vendorId)
      .set('limit', '500')
      .set('page', '1')
      .set('status', 'all');

    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data?: { items: Record<string, unknown>[] } }>(
          `${this.base}/produits`,
          { params }
        )
      );
      const items = res?.data?.items ?? [];
      this.cache = items.map((i) => this.mapApiToProduct(i));
      return this.cache;
    } catch (e) {
      this.cache = [];
      throw new Error(this.apiErrorMessage(e));
    }
  }

  getAll(): Product[] {
    return [...this.cache];
  }

  getById(id: string): Product | undefined {
    return this.cache.find((p) => p.id === id);
  }

  async fetchOne(id: string): Promise<Product | undefined> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data?: Record<string, unknown> }>(
          `${this.base}/produits/${encodeURIComponent(id)}`
        )
      );
      if (!res?.success || !res.data) return undefined;
      return this.mapApiToProduct(res.data);
    } catch {
      return undefined;
    }
  }

  listCategories(): string[] {
    return [...new Set(this.cache.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  }

  getFiltered(filters: VendorProductFilters = {}): Product[] {
    const q = filters.q?.trim().toLowerCase() ?? '';
    const category = filters.category?.trim() ?? '';
    const status = filters.status ?? 'all';
    const stock = filters.stock ?? 'all';
    const sort = filters.sort ?? 'recent';

    let items = this.cache.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchCategory = !category || p.category === category;
      const matchStatus = status === 'all' || p.status === status;
      const threshold = p.lowStockThreshold;
      const matchStock =
        stock === 'all' || (stock === 'low' && p.stock > 0 && p.stock <= threshold) || (stock === 'out' && p.stock <= 0);
      return matchQ && matchCategory && matchStatus && matchStock;
    });

    items = items.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'stock_asc':
          return a.stock - b.stock;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return items;
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const body = this.toCreateBody(data);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; data?: Record<string, unknown> }>(`${this.base}/produits`, body)
      );
      if (!res?.success || !res.data) {
        throw new Error('Réponse invalide du serveur');
      }
      const p = this.mapApiToProduct(res.data);
      this.cache.unshift(p);
      return p;
    } catch (e) {
      throw new Error(this.apiErrorMessage(e));
    }
  }

  async update(id: string, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | undefined> {
    const body = this.toCreateBody(data);
    try {
      const res = await firstValueFrom(
        this.http.put<{ success: boolean; data?: Record<string, unknown> }>(
          `${this.base}/produits/${encodeURIComponent(id)}`,
          body
        )
      );
      if (!res?.success || !res.data) return undefined;
      const p = this.mapApiToProduct(res.data);
      const idx = this.cache.findIndex((x) => x.id === id);
      if (idx >= 0) this.cache[idx] = p;
      return p;
    } catch (e) {
      throw new Error(this.apiErrorMessage(e));
    }
  }

  /** Partial update (e.g. bulk status or stock) */
  async patch(id: string, patch: Record<string, unknown>): Promise<Product | undefined> {
    try {
      const res = await firstValueFrom(
        this.http.put<{ success: boolean; data?: Record<string, unknown> }>(
          `${this.base}/produits/${encodeURIComponent(id)}`,
          patch
        )
      );
      if (!res?.success || !res.data) return undefined;
      const p = this.mapApiToProduct(res.data);
      const idx = this.cache.findIndex((x) => x.id === id);
      if (idx >= 0) this.cache[idx] = p;
      return p;
    } catch (e) {
      throw new Error(this.apiErrorMessage(e));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.base}/produits/${encodeURIComponent(id)}`));
      this.cache = this.cache.filter((p) => p.id !== id);
    } catch (e) {
      throw new Error(this.apiErrorMessage(e));
    }
  }

  async updateStatus(ids: string[], status: ProductStatus): Promise<void> {
    if (!ids.length) return;
    await Promise.all(ids.map((id) => this.patch(id, { status })));
  }

  async adjustStock(ids: string[], delta: number): Promise<void> {
    if (!ids.length || !delta) return;
    await Promise.all(
      ids.map((id) => {
        const p = this.cache.find((x) => x.id === id);
        const next = Math.max(0, (p?.stock ?? 0) + delta);
        return this.patch(id, { stock: next });
      })
    );
  }

  async adjustPricePercent(ids: string[], percent: number): Promise<void> {
    if (!ids.length || !percent) return;
    const factor = 1 + percent / 100;
    await Promise.all(
      ids.map((id) => {
        const p = this.cache.find((x) => x.id === id);
        const next = Math.max(0.01, Number(((p?.price ?? 0) * factor).toFixed(2)));
        return this.patch(id, { price: next });
      })
    );
  }
}
