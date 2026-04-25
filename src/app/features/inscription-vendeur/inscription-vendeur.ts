import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ServiceAuthVendeur } from '../../core/services/service-auth-vendeur';

@Component({
  selector: 'app-inscription-vendeur',
  imports: [FormsModule, RouterLink],
  templateUrl: './inscription-vendeur.html',
  styleUrl: './inscription-vendeur.scss'
})
export class InscriptionVendeur {
  registerError = '';
  loading = false;

  name = '';
  email = '';
  password = '';
  phone = '';
  businessName = '';
  siret = '';
  address = '';
  taxId = '';
  iban = '';

  constructor(
    private readonly router: Router,
    private readonly auth: ServiceAuthVendeur
  ) {}

  private isValidEmail(email: string): boolean {
    const value = email.trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPassword(password: string): boolean {
    return password.trim().length >= 8;
  }

  canSubmit(): boolean {
    return (
      !!this.name.trim() &&
      this.isValidEmail(this.email) &&
      this.isValidPassword(this.password) &&
      !!this.businessName.trim() &&
      !this.loading
    );
  }

  handleRegister(): void {
    if (!this.name.trim()) {
      this.registerError = 'Veuillez renseigner votre nom.';
      return;
    }
    if (!this.isValidEmail(this.email)) {
      this.registerError = 'Veuillez saisir une adresse e-mail valide.';
      return;
    }
    if (!this.isValidPassword(this.password)) {
      this.registerError = 'Votre mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (!this.businessName.trim()) {
      this.registerError = 'Veuillez renseigner le nom de votre entreprise.';
      return;
    }

    this.registerError = '';
    this.loading = true;

    this.auth
      .register({
        email: this.email.trim(),
        password: this.password.trim(),
        username: this.name.trim(),
        phone: this.phone.trim() || undefined,
        role: 'vendor',
        businessName: this.businessName.trim(),
        siret: this.siret.trim() || undefined,
        address: this.address.trim() || undefined,
        taxId: this.taxId.trim() || undefined,
        iban: this.iban.trim() || undefined
      })
      .subscribe({
        next: (result) => {
          this.loading = false;
          if (result.ok) {
            this.router.navigate(['/vendeur/connexion'], {
              queryParams: { msg: 'pending' }
            });
          } else {
            this.registerError = result.error ?? 'Erreur d\'inscription';
          }
        },
        error: () => {
          this.loading = false;
          this.registerError = 'Erreur d\'inscription. Veuillez réessayer.';
        }
      });
  }
}
