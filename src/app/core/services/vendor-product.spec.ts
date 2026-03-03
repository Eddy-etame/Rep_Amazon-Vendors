import { TestBed } from '@angular/core/testing';

import { VendorProduct } from './vendor-product';

describe('VendorProduct', () => {
  let service: VendorProduct;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendorProduct);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
