import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { ProductFormComponent } from './features/product-form/product-form.component';
import { Messages } from './features/messages/messages';
import { Orders } from './features/orders/orders';
import { Returns } from './features/returns/returns';

export const routes: Routes = [
  { path: '', redirectTo: 'seller/dashboard', pathMatch: 'full' },
  { path: 'seller/dashboard', component: Dashboard },
  { path: 'seller/products', component: Products },
  { path: 'seller/orders', component: Orders },
  { path: 'seller/returns', component: Returns },
  { path: 'seller/messages', component: Messages },
  { path: 'seller/product/new', component: ProductFormComponent },
  { path: 'seller/product/:id/edit', component: ProductFormComponent },
  { path: '**', redirectTo: 'seller/dashboard' }
];
