import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface VendorMessagePayload {
  produitId?: string;
  productId?: string;
  destinataireId: string;
  userId?: string;
  vendorId?: string;
  contenu?: string;
  content?: string;
  subject?: string;
  productTitle?: string;
  orderId?: string;
}

export interface VendorConversationDto {
  id: string;
  userId: string;
  userName: string;
  vendorId: string;
  vendorName: string;
  subject: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  unreadByVendor?: number;
  unreadByUser?: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt: string;
}

export interface VendorMessageDto {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'vendor';
  content: string;
  userId: string;
  userName?: string;
  vendorId: string;
  vendorName?: string;
  subject?: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  sentAt: string;
  readByVendor?: boolean;
}

export interface VendorConversationListResponse {
  data?: {
    items?: VendorConversationDto[];
  };
}

export interface VendorMessageListResponse {
  data?: {
    items?: VendorMessageDto[];
  };
}

export interface VendorMessageResponse {
  data?: VendorMessageDto;
}

@Injectable({ providedIn: 'root' })
export class ServiceApiMessagerieVendeur {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  listConversations(): Observable<VendorConversationListResponse> {
    return this.http.get<VendorConversationListResponse>(`${this.baseUrl}/messages/conversations`);
  }

  listByProduct(productId: string): Observable<VendorMessageListResponse> {
    return this.http.get<VendorMessageListResponse>(`${this.baseUrl}/messages/${encodeURIComponent(productId)}`);
  }

  send(payload: VendorMessagePayload): Observable<VendorMessageResponse> {
    return this.http.post<VendorMessageResponse>(`${this.baseUrl}/messages`, payload);
  }
}
