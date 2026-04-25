import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ServiceJetonAuthVendeur } from '../services/service-jeton-auth-vendeur';
import { ServicePowVendeur } from '../services/service-pow-vendeur';
import { sha256Hex } from '../utils/crypto';
import { buildFingerprint } from '../utils/fingerprint';

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

let clientFingerprintPromise: Promise<string> | null = null;
let gatewayFingerprintPromise: Promise<string> | null = null;

export const intercepteurSecuriteVendeur: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(ServiceJetonAuthVendeur);
  const powService = inject(ServicePowVendeur);
  const apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  return from(
    (async () => {
      const headers: Record<string, string> = {
        'X-Request-Id': generateRequestId()
      };

      if (!clientFingerprintPromise) {
        clientFingerprintPromise = buildFingerprint();
      }
      const clientFingerprint = await clientFingerprintPromise;
      headers['X-Client-Fingerprint'] = clientFingerprint;

      if (!gatewayFingerprintPromise) {
        gatewayFingerprintPromise = sha256Hex(`fp:${clientFingerprint}`);
      }
      const gatewayFingerprint = await gatewayFingerprintPromise;

      const token = tokenService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (req.url.startsWith(apiBaseUrl)) {
        const proof = await powService.generateProof({
          method: req.method,
          url: req.urlWithParams,
          fingerprintHash: gatewayFingerprint
        });
        if (proof) {
          headers['X-PoW-Proof'] = proof.proof;
          headers['X-PoW-Nonce'] = proof.nonce;
          headers['X-PoW-Timestamp'] = String(proof.timestamp);
        }
      }

      return headers;
    })()
  ).pipe(switchMap((headers) => next(req.clone({ setHeaders: headers }))));
};
