import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { VendorAuthService } from '../../core/services/vendor-auth.service';

@Component({
  selector: 'app-vendor-login',
  imports: [RouterLink],
  templateUrl: './vendor-login.html',
  styleUrl: './vendor-login.scss'
})
export class VendorLoginComponent {
  loginError = '';
  loading = false;
  showPassword = false;

  constructor(
    readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: VendorAuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  private get redirectUrl(): string {
    const r = (this.route.snapshot.queryParamMap.get('redirect') || '/seller/dashboard').trim();
    const normalized = r.startsWith('/') ? r : `/${r}`;
    if (
      normalized.startsWith('/seller/') &&
      !normalized.includes('/seller/login') &&
      !normalized.includes('/seller/register')
    ) {
      return normalized;
    }
    return '/seller/dashboard';
  }

  private isValidEmail(email: string): boolean {
    const value = email.trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPassword(password: string): boolean {
    return password.trim().length >= 8;
  }

  isLoginDisabled(email: string, password: string): boolean {
    return !this.isValidEmail(email) || !this.isValidPassword(password) || this.loading;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  handleLogin(email: string, password: string): void {
    if (!this.isValidEmail(email)) {
      this.loginError = 'Veuillez saisir une adresse e-mail valide.';
      return;
    }
    if (!this.isValidPassword(password)) {
      this.loginError = 'Votre mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.loginError = '';
    this.loading = true;

    this.auth.login(email.trim(), password.trim()).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.ok) {
          this.cdr.detectChanges();
          this.router.navigate(['/seller/dashboard'], { replaceUrl: true });
        } else {
          this.loginError = 'Connexion impossible. Vérifiez vos identifiants.';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.loginError = 'Connexion impossible. Vérifiez vos identifiants.';
        this.cdr.detectChanges();
      }
    });
  }
}
