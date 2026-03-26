import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { VendorAuthService } from './vendor-auth.service';
import { VendorAuthTokenService } from './vendor-auth-token.service';

export interface VendorSession {
  id: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class VendorSessionStore {
  private readonly sessionSignal = signal<VendorSession | null>(null);

  readonly session = this.sessionSignal.asReadonly();

  constructor(
    private readonly authService: VendorAuthService,
    private readonly tokenService: VendorAuthTokenService
  ) {
    void this.loadIfTokenExists();
  }

  async load(): Promise<VendorSession | null> {
    if (!this.tokenService.getToken() || this.tokenService.isTokenExpired()) {
      this.sessionSignal.set(null);
      return null;
    }

    try {
      const res = await firstValueFrom(this.authService.me());
      const user = res?.data?.user;
      if (user?.id) {
        const session: VendorSession = {
          id: user.id,
          username: user.username ?? user.email ?? 'Vendeur'
        };
        this.sessionSignal.set(session);
        return session;
      }
    } catch {
      this.sessionSignal.set(null);
    }
    return null;
  }

  clear(): void {
    this.sessionSignal.set(null);
  }

  get vendorId(): string {
    return this.sessionSignal()?.id ?? '';
  }

  get vendorName(): string {
    return this.sessionSignal()?.username ?? 'Vendeur';
  }

  private loadIfTokenExists(): void {
    if (this.tokenService.getToken() && !this.tokenService.isTokenExpired()) {
      void this.load();
    }
  }
}
