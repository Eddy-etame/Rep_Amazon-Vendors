import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { Products } from './features/products/products';
import { ProductFormComponent } from './features/product-form/product-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'seller/dashboard', pathMatch: 'full' },
  { path: 'seller/dashboard', component: Dashboard },
  { path: 'seller/products', component: Products },
  { path: 'seller/product/new', component: ProductFormComponent },
  { path: 'seller/product/:id/edit', component: ProductFormComponent },
  { path: '**', redirectTo: 'seller/dashboard' }
];
