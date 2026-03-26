import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { VendorAuthTokenService } from './vendor-auth-token.service';

export interface LoginResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string; role: string };
    token: string;
    accessToken: string;
    accessExpiresAt: string;
  };
  error?: { code: string; message: string };
}

export interface RegisterResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string; role: string };
    token: string;
    accessToken: string;
    accessExpiresAt: string;
  };
  error?: { code: string; message: string };
}

export interface VendorMeResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      username?: string;
      phone?: string;
      role: string;
    };
  };
}

export interface VendorRegisterPayload {
  email: string;
  password: string;
  username?: string;
  phone?: string;
  role: 'vendor';
  businessName: string;
  siret?: string;
  address?: string;
  taxId?: string;
  iban?: string;
}

@Injectable({ providedIn: 'root' })
export class VendorAuthService {
  private readonly baseUrl = `${environment.apiBaseUrl.replace(/\/+$/, '')}/auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: VendorAuthTokenService
  ) {}

  login(email: string, password: string): Observable<{ ok: boolean; error?: string }> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        timeout(15000),
        map((res: LoginResponse) => {
          const data = res.data;
          const token = data?.token ?? data?.accessToken;
          const success = Boolean(res?.success);
          if (success && token) {
            this.tokenService.setToken(token);
            if (data?.accessExpiresAt != null) {
              this.tokenService.setAccessExpiresAt(String(data.accessExpiresAt));
            }
            return { ok: true };
          }
          return { ok: false, error: 'Connexion impossible. Vérifiez vos identifiants.' };
        }),
        catchError((err) => {
          const msg =
            err?.error?.error?.message ??
            err?.error?.message ??
            'Connexion impossible. Vérifiez vos identifiants.';
          return of({ ok: false, error: msg });
        })
      );
  }

  register(payload: VendorRegisterPayload): Observable<{ ok: boolean; error?: string }> {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/register`, payload)
      .pipe(
        map((res) => {
          if (res.success && res.data?.token) {
            this.tokenService.setToken(res.data.token);
            if (res.data.accessExpiresAt) {
              this.tokenService.setAccessExpiresAt(res.data.accessExpiresAt);
            }
            return { ok: true };
          }
          return { ok: false, error: res.error?.message ?? 'Erreur d\'inscription' };
        }),
        catchError((err) => {
          const msg =
            err?.error?.error?.message ??
            err?.message ??
            'Erreur d\'inscription';
          return of({ ok: false, error: msg });
        })
      );
  }

  me(): Observable<VendorMeResponse> {
    return this.http.get<VendorMeResponse>(`${this.baseUrl}/me`);
  }

  logout(): Observable<{ success?: boolean }> {
    return this.http.post<{ success?: boolean }>(`${this.baseUrl}/logout`, {});
  }
}
