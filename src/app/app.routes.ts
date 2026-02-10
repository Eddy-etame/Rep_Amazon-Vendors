import type { Routes } from '@angular/router';
import { Cart } from './pages/cart/cart';
import { Catalog } from './pages/catalog/catalog';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { Orders } from './pages/orders/orders';
import { Product } from './pages/product/product';
import { Profile } from './pages/profile/profile';
import { Register } from './pages/register/register';

export const routes: Routes = [
    {path: '', redirectTo: 'catalog', pathMatch: 'full'},
    { path: 'cart', component: Cart },
    { path: 'catalog', component: Catalog },
    { path: 'checkout', component: Checkout },
    { path: 'login', component: Login },
    { path: 'orders', component: Orders },
    { path: 'product', component: Product },
    { path: 'profile', component: Profile },
    { path: 'register', component: Register }
];
