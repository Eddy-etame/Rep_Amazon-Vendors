import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ServiceJetonAuthVendeur } from '../services/service-jeton-auth-vendeur';

export const gardeAuthVendeur: CanActivateFn = () => {
  const tokenService = inject(ServiceJetonAuthVendeur);
  const router = inject(Router);

  const token = tokenService.getToken();
  if (!token) {
    const raw = router.url || '/vendeur/tableau-de-bord';
    const currentUrl =
      !raw || raw.includes('/vendeur/connexion') || raw.includes('/vendeur/inscription')
        ? '/vendeur/tableau-de-bord'
        : raw;
    return router.createUrlTree(['/vendeur/connexion'], {
      queryParams: { redirect: currentUrl }
    });
  }

  if (tokenService.isTokenExpired()) {
    tokenService.clearToken();
    const raw = router.url || '/vendeur/tableau-de-bord';
    const currentUrl =
      !raw || raw.includes('/vendeur/connexion') || raw.includes('/vendeur/inscription')
        ? '/vendeur/tableau-de-bord'
        : raw;
    return router.createUrlTree(['/vendeur/connexion'], {
      queryParams: { redirect: currentUrl }
    });
  }

  return true;
};
