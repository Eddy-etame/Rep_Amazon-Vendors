export type VendorOrderStatus = 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface VendorOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface VendorOrder {
  id: string;
  userId: string;
  userName: string;
  createdAt: number;
  updatedAt?: number;
  status: VendorOrderStatus;
  estimatedDeliveryAt: number;
  deliveredAt?: number;
  total: number;
  currency?: string;
  items: VendorOrderItem[];
  shippingCity: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus?: string;
}
