import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { ProductFormComponent } from './features/product-form/product-form.component';
import { Messages } from './features/messages/messages';
import { Orders } from './features/orders/orders';
import { Returns } from './features/returns/returns';
import { VendorLoginComponent } from './features/login/vendor-login';
import { VendorRegisterComponent } from './features/register/vendor-register';
import { vendorAuthGuard } from './core/guards/vendor-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'seller/dashboard', pathMatch: 'full' },
  { path: 'seller/login', component: VendorLoginComponent },
  { path: 'seller/register', component: VendorRegisterComponent },
  { path: 'seller/dashboard', component: Dashboard, canActivate: [vendorAuthGuard] },
  { path: 'seller/products', component: Products, canActivate: [vendorAuthGuard] },
  { path: 'seller/orders', component: Orders, canActivate: [vendorAuthGuard] },
  { path: 'seller/returns', component: Returns, canActivate: [vendorAuthGuard] },
  { path: 'seller/messages', component: Messages, canActivate: [vendorAuthGuard] },
  { path: 'seller/product/new', component: ProductFormComponent, canActivate: [vendorAuthGuard] },
  { path: 'seller/product/:id/edit', component: ProductFormComponent, canActivate: [vendorAuthGuard] },
  { path: '**', redirectTo: 'seller/dashboard' }
];
