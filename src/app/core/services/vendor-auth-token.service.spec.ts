import { TestBed } from '@angular/core/testing';

import { VendorAuthTokenService } from './vendor-auth-token.service';

describe('VendorAuthTokenService', () => {
  let service: VendorAuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendorAuthTokenService);
    service.clearToken();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isTokenExpired', () => {
    it('should return false when accessExpiresAt is a future Unix ms string', () => {
      const futureMs = Date.now() + 60 * 60 * 1000;
      service.setAccessExpiresAt(String(futureMs));
      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return true when accessExpiresAt is in the past', () => {
      const pastMs = Date.now() - 60 * 60 * 1000;
      service.setAccessExpiresAt(String(pastMs));
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should return false when accessExpiresAt is null or empty', () => {
      service.clearToken();
      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return false when accessExpiresAt is Unix ms string in the future', () => {
      const futureMs = Date.now() + 24 * 60 * 60 * 1000;
      service.setAccessExpiresAt(String(futureMs));
      expect(service.isTokenExpired()).toBe(false);
    });
  });
});
