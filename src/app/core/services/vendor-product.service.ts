import { Injectable } from '@angular/core';
import { Product, ProductStatus } from '../models/product.model';

const KEY = 'vendor_products';

export interface VendorProductFilters {
  q?: string;
  category?: string;
  status?: ProductStatus | 'all';
  stock?: 'all' | 'low' | 'out';
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'name_asc';
}

@Injectable({ providedIn: 'root' })
export class VendorProductService {
  private normalize(raw: Partial<Product>, index = 0): Product {
    const now = Date.now();
    const id = typeof raw.id === 'number' ? raw.id : now + index;
    const fallbackName = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Produit sans nom';
    const sku = typeof raw.sku === 'string' && raw.sku.trim() ? raw.sku.trim() : `SKU-${id}`;
    const image = typeof raw.image === 'string' ? raw.image : '';
    const galleryInput = Array.isArray(raw.gallery) ? raw.gallery : [];
    const gallery = [...new Set(galleryInput.filter((g): g is string => typeof g === 'string' && g.trim() !== ''))];
    const statusRaw = raw.status;
    const status: ProductStatus =
      statusRaw === 'draft' || statusRaw === 'archived' || statusRaw === 'published' ? statusRaw : 'published';
    const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : now;
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : now;

    return {
      id,
      sku,
      name: fallbackName,
      price: typeof raw.price === 'number' ? raw.price : 0,
      description: typeof raw.description === 'string' ? raw.description : '',
      image,
      gallery,
      stock: typeof raw.stock === 'number' ? raw.stock : 0,
      lowStockThreshold: typeof raw.lowStockThreshold === 'number' ? raw.lowStockThreshold : 5,
      category: typeof raw.category === 'string' ? raw.category : 'Divers',
      status,
      createdAt,
      updatedAt
    };
  }

  private buildSku(name: string): string {
    const slug = name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 14);
    return `SKU-${slug || 'PROD'}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  private read(): Product[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as Partial<Product>[];
      return parsed.map((entry, index) => this.normalize(entry, index));
    } catch {
      return [];
    }
  }

  private write(products: Product[]): void {
    localStorage.setItem(KEY, JSON.stringify(products));
  }

  getAll(): Product[] {
    return this.read();
  }

  getById(id: number): Product | undefined {
    return this.read().find(p => p.id === id);
  }

  listCategories(): string[] {
    return [...new Set(this.read().map((p) => p.category))].sort((a, b) => a.localeCompare(b));
  }

  getFiltered(filters: VendorProductFilters = {}): Product[] {
    const q = filters.q?.trim().toLowerCase() ?? '';
    const category = filters.category?.trim() ?? '';
    const status = filters.status ?? 'all';
    const stock = filters.stock ?? 'all';
    const sort = filters.sort ?? 'recent';

    let items = this.read().filter((p) => {
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

  create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.read();
    const now = Date.now();
    const newProduct: Product = this.normalize({
      ...data,
      id: now,
      createdAt: now,
      updatedAt: now,
      sku: data.sku?.trim() ? data.sku : this.buildSku(data.name)
    });
    products.unshift(newProduct);
    this.write(products);
    return newProduct;
  }

  update(id: number, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product | undefined {
    const products = this.read();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    products[idx] = this.normalize({
      ...products[idx],
      ...data,
      id,
      createdAt: products[idx].createdAt,
      updatedAt: Date.now()
    });
    this.write(products);
    return products[idx];
  }

  remove(id: number): void {
    const products = this.read().filter(p => p.id !== id);
    this.write(products);
  }

  updateStatus(ids: number[], status: ProductStatus): void {
    if (!ids.length) return;
    const idSet = new Set(ids);
    const products = this.read().map((p) =>
      idSet.has(p.id) ? { ...p, status, updatedAt: Date.now() } : p
    );
    this.write(products);
  }

  adjustStock(ids: number[], delta: number): void {
    if (!ids.length || !delta) return;
    const idSet = new Set(ids);
    const products = this.read().map((p) =>
      idSet.has(p.id)
        ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: Date.now() }
        : p
    );
    this.write(products);
  }

  adjustPricePercent(ids: number[], percent: number): void {
    if (!ids.length || !percent) return;
    const factor = 1 + percent / 100;
    const idSet = new Set(ids);
    const products = this.read().map((p) =>
      idSet.has(p.id)
        ? { ...p, price: Math.max(0.01, Number((p.price * factor).toFixed(2))), updatedAt: Date.now() }
        : p
    );
    this.write(products);
  }

  seedIfEmpty(): void {
    if (this.read().length) return;
    const now = Date.now();
    this.write([
      this.normalize({
        id: now,
        sku: 'SKU-CASQUE-1001',
        name: 'Casque Bluetooth Premium',
        price: 89.99,
        description: 'Casque sans fil haute qualité avec réduction de bruit active, batterie 30h, son cristallin.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1280',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1280'
        ],
        stock: 15,
        lowStockThreshold: 5,
        category: 'Électronique',
        status: 'published',
        createdAt: now,
        updatedAt: now
      }),
      this.normalize({
        id: now + 1,
        sku: 'SKU-MONTRE-1002',
        name: 'Montre Connectée Sport',
        price: 199.99,
        description: 'Montre intelligente avec suivi cardiaque, GPS, écran AMOLED, résistante à l\'eau.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1280',
          'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1280'
        ],
        stock: 8,
        lowStockThreshold: 4,
        category: 'Électronique',
        status: 'published',
        createdAt: now,
        updatedAt: now
      }),
      this.normalize({
        id: now + 2,
        sku: 'SKU-SAC-1003',
        name: 'Sac à Dos Urban',
        price: 49.99,
        description: 'Sac à dos ergonomique avec compartiments, port USB, design moderne et durable.',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1280',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1280'
        ],
        stock: 25,
        lowStockThreshold: 6,
        category: 'Accessoires',
        status: 'published',
        createdAt: now,
        updatedAt: now
      }),
      this.normalize({
        id: now + 3,
        sku: 'SKU-LAMPE-1004',
        name: 'Lampe LED Ambiance',
        price: 34.99,
        description: '16 millions de couleurs, compatible Alexa, minuteur programmable, économe en énergie.',
        image: 'https://images.unsplash.com/photo-1565636192335-14a0f4cfbaeb?w=400&h=400&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1565636192335-14a0f4cfbaeb?w=1280',
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1280'
        ],
        stock: 12,
        lowStockThreshold: 3,
        category: 'Maison',
        status: 'published',
        createdAt: now,
        updatedAt: now
      }),
      this.normalize({
        id: now + 4,
        sku: 'SKU-BATTERY-1005',
        name: 'Batterie Externe 30000mAh',
        price: 39.99,
        description: 'Charge rapide 65W, 3 ports USB-C, écran LED, compatible tous téléphones.',
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
        gallery: [
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=1280',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1280'
        ],
        stock: 20,
        lowStockThreshold: 5,
        category: 'Accessoires',
        status: 'draft',
        createdAt: now,
        updatedAt: now
      })
    ]);
  }
}
