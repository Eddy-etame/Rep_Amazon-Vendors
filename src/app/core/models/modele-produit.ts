export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description: string;
  image: string;
  gallery: string[];
  stock: number;
  lowStockThreshold: number;
  category: string;
  status: ProductStatus;
  createdAt: number;
  updatedAt: number;
}
