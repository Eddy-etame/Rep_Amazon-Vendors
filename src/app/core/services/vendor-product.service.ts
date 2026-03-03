import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

const KEY = 'vendor_products';

@Injectable({ providedIn: 'root' })
export class VendorProductService {
  private read(): Product[] {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
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

  create(data: Omit<Product, 'id'>): Product {
    const products = this.read();
    const newProduct: Product = { ...data, id: Date.now() };
    products.unshift(newProduct);
    this.write(products);
    return newProduct;
  }

  update(id: number, data: Omit<Product, 'id'>): Product | undefined {
    const products = this.read();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    products[idx] = { ...data, id };
    this.write(products);
    return products[idx];
  }

  remove(id: number): void {
    const products = this.read().filter(p => p.id !== id);
    this.write(products);
  }

  seedIfEmpty(): void {
    if (this.read().length) return;
    this.write([
      {
        id: Date.now(),
        name: 'Casque Bluetooth Premium',
        price: 89.99,
        description: 'Casque sans fil haute qualité avec réduction de bruit active, batterie 30h, son cristallin.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        stock: 15,
        category: 'Électronique'
      },
      {
        id: Date.now() + 1,
        name: 'Montre Connectée Sport',
        price: 199.99,
        description: 'Montre intelligente avec suivi cardiaque, GPS, écran AMOLED, résistante à l\'eau.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        stock: 8,
        category: 'Électronique'
      },
      {
        id: Date.now() + 2,
        name: 'Sac à Dos Urban',
        price: 49.99,
        description: 'Sac à dos ergonomique avec compartiments, port USB, design moderne et durable.',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        stock: 25,
        category: 'Accessoires'
      },
      {
        id: Date.now() + 3,
        name: 'Lampe LED Ambiance',
        price: 34.99,
        description: '16 millions de couleurs, compatible Alexa, minuteur programmable, économe en énergie.',
        image: 'https://images.unsplash.com/photo-1565636192335-14a0f4cfbaeb?w=400&h=400&fit=crop',
        stock: 12,
        category: 'Maison'
      },
      {
        id: Date.now() + 4,
        name: 'Batterie Externe 30000mAh',
        price: 39.99,
        description: 'Charge rapide 65W, 3 ports USB-C, écran LED, compatible tous téléphones.',
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop',
        stock: 20,
        category: 'Accessoires'
      }
    ]);
  }
}
