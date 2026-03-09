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

@Injectable({ providedIn: 'root' })
export class VendorMessagingApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  listByProduct(productId: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/messages/${productId}`);
  }

  send(payload: VendorMessagePayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/messages`, payload);
  }
}
