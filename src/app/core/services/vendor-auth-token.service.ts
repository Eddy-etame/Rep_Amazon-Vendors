import { Injectable } from '@angular/core';

const VENDOR_TOKEN_KEY = 'amaz_vendor_token';
const SHARED_TOKEN_KEY = 'amaz_token';

@Injectable({ providedIn: 'root' })
export class VendorAuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(VENDOR_TOKEN_KEY) || localStorage.getItem(SHARED_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(VENDOR_TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
  }
}
