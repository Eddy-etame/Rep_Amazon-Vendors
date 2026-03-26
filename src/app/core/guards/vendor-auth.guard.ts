import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { VendorAuthTokenService } from '../services/vendor-auth-token.service';

export const vendorAuthGuard: CanActivateFn = () => {
  const tokenService = inject(VendorAuthTokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  if (!token) {
    const raw = router.url || '/seller/dashboard';
    const currentUrl =
      !raw || raw.includes('/seller/login') || raw.includes('/seller/register')
        ? '/seller/dashboard'
        : raw;
    return router.createUrlTree(['/seller/login'], {
      queryParams: { redirect: currentUrl }
    });
  }

  if (tokenService.isTokenExpired()) {
    tokenService.clearToken();
    const raw = router.url || '/seller/dashboard';
    const currentUrl =
      !raw || raw.includes('/seller/login') || raw.includes('/seller/register')
        ? '/seller/dashboard'
        : raw;
    return router.createUrlTree(['/seller/login'], {
      queryParams: { redirect: currentUrl }
    });
  }

  return true;
};
