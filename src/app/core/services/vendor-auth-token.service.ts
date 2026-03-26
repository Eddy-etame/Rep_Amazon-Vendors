import { Injectable } from '@angular/core';

const VENDOR_TOKEN_KEY = 'amaz_vendor_token';
const VENDOR_ACCESS_EXPIRES_KEY = 'amaz_vendor_access_expires';
const SHARED_TOKEN_KEY = 'amaz_token';

@Injectable({ providedIn: 'root' })
export class VendorAuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(VENDOR_TOKEN_KEY) || localStorage.getItem(SHARED_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(VENDOR_TOKEN_KEY, token);
  }

  setAccessExpiresAt(expiresAt: string): void {
    if (expiresAt) {
      localStorage.setItem(VENDOR_ACCESS_EXPIRES_KEY, expiresAt);
    }
  }

  getAccessExpiresAt(): string | null {
    return localStorage.getItem(VENDOR_ACCESS_EXPIRES_KEY);
  }

  isTokenExpired(): boolean {
    const expiresAt = this.getAccessExpiresAt();
    if (!expiresAt) return false;
    const ms = Number(expiresAt);
    return isNaN(ms) || ms <= Date.now();
  }

  clearToken(): void {
    localStorage.removeItem(VENDOR_TOKEN_KEY);
    localStorage.removeItem(VENDOR_ACCESS_EXPIRES_KEY);
  }
}
