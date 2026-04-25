import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { sha256Hex } from '../utils/crypto';

export interface VendorPowPayload {
  method: string;
  url: string;
  fingerprintHash: string;
}

export interface VendorPowResult {
  proof: string;
  nonce: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ServicePowVendeur {
  private normalizePath(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return url.startsWith('/') ? url : `/${url}`;
    }
  }

  private randomNonceSeed(): string {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async generateProof(payload: VendorPowPayload): Promise<VendorPowResult | null> {
    const difficulty = environment.powDifficulty ?? 0;
    if (difficulty <= 0) {
      return null;
    }

    const timestamp = Date.now();
    const method = payload.method.toUpperCase();
    const path = this.normalizePath(payload.url);
    const fingerprintHash = payload.fingerprintHash;
    const targetPrefix = '0'.repeat(difficulty);
    const seed = this.randomNonceSeed();
    const maxAttempts = 250_000;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const nonce = `${seed}-${attempt}`;
      const candidate = `${method}:${path}:${timestamp}:${nonce}:${fingerprintHash}`;
      const hash = await sha256Hex(candidate);
      if (hash.startsWith(targetPrefix)) {
        return {
          proof: hash,
          nonce,
          timestamp
        };
      }
    }

    return null;
  }
}
