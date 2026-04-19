export type VendorReturnStatus = 'open' | 'approved' | 'rejected' | 'received' | 'refunded';

export interface VendorReturnItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface VendorReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  vendorId?: string;
  userName: string;
  reason: string;
  qrReference: string;
  createdAt: number;
  updatedAt?: number;
  status: VendorReturnStatus;
  items: VendorReturnItem[];
}
