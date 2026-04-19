import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { Notifications } from './shared/components/notifications';
import { DialogueConfirmation } from './shared/components/dialogue-confirmation';
import { ServiceAuthVendeur } from './core/services/service-auth-vendeur';
import { ServiceJetonAuthVendeur } from './core/services/service-jeton-auth-vendeur';
import { DepotSessionVendeur } from './core/services/depot-session-vendeur';
import {
  ThemePreference,
  ServicePreferenceTheme
} from '../../../shared-frontend/service-preference-theme';

interface SellerNavItem {
  route: string;
  label: string;
}

const SELLER_NAV_ITEMS: SellerNavItem[] = [
  { route: '/vendeur/tableau-de-bord', label: 'Tableau de bord' },
  { route: '/vendeur/produits', label: 'Catalogue' },
  { route: '/vendeur/commandes', label: 'Commandes' },
  { route: '/vendeur/retours', label: 'Retours' },
  { route: '/vendeur/messagerie', label: 'Messagerie' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Notifications, DialogueConfirmation],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  readonly usersAppUrl = environment.usersAppUrl;
  readonly navItems = SELLER_NAV_ITEMS;
  readonly themeOptions: ThemePreference[] = ['system', 'light', 'dark'];

  private readonly vendorAuth = inject(ServiceAuthVendeur);
  private readonly tokenService = inject(ServiceJetonAuthVendeur);
  private readonly vendorSession = inject(DepotSessionVendeur);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themePreferenceService = new ServicePreferenceTheme();

  sectionTitle = 'Connexion vendeur';
  sectionDescription = 'Accédez à votre espace vendeur Amaz.';

  ngOnInit(): void {
    if (this.isAuthenticated) {
      void this.vendorSession.load();
    }

    this.updateSectionMeta(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.updateSectionMeta(event.urlAfterRedirects);
        if (this.isAuthenticated && !this.vendorSession.vendorId) {
          void this.vendorSession.load();
        }
      });
  }

  get isAuthenticated(): boolean {
    const token = this.tokenService.getToken();
    return !!token && !this.tokenService.isTokenExpired();
  }

  get vendorName(): string {
    return this.vendorSession.vendorName || 'Vendeur';
  }

  get vendorId(): string {
    return this.vendorSession.vendorId || 'Session en cours';
  }

  get currentThemePreference(): ThemePreference {
    return this.themePreferenceService.current;
  }

  setThemePreference(preference: ThemePreference): void {
    this.themePreferenceService.setPreference(preference);
  }

  logout(): void {
    firstValueFrom(this.vendorAuth.logout()).catch(() => undefined);
    this.tokenService.clearToken();
    this.vendorSession.clear();
    void this.router.navigate(['/vendeur/connexion']);
  }

  private updateSectionMeta(url: string): void {
    if (url.startsWith('/vendeur/tableau-de-bord')) {
      this.sectionTitle = 'Pilotage vendeur';
      this.sectionDescription = 'Suivez vos KPIs, vos alertes et les actions prioritaires du jour.';
      return;
    }
    if (url.startsWith('/vendeur/produits')) {
      this.sectionTitle = 'Catalogue vendeur';
      this.sectionDescription = 'Administrez les fiches, les prix et la qualité de publication.';
      return;
    }
    if (url.startsWith('/vendeur/produit/nouveau')) {
      this.sectionTitle = 'Nouveau produit';
      this.sectionDescription = 'Ajoutez une fiche propre, complète et prête pour la publication.';
      return;
    }
    if (url.includes('/vendeur/produit/') && url.endsWith('/modifier')) {
      this.sectionTitle = 'Édition produit';
      this.sectionDescription = 'Mettez à jour votre offre sans perdre la cohérence catalogue.';
      return;
    }
    if (url.startsWith('/vendeur/commandes')) {
      this.sectionTitle = 'Opérations commandes';
      this.sectionDescription = 'Suivez les statuts réels, les délais et les actions de traitement.';
      return;
    }
    if (url.startsWith('/vendeur/retours')) {
      this.sectionTitle = 'Centre retours';
      this.sectionDescription = 'Traitez les retours réels avec un suivi clair par vendeur.';
      return;
    }
    if (url.startsWith('/vendeur/messagerie')) {
      this.sectionTitle = 'Messagerie client';
      this.sectionDescription = 'Répondez aux conversations véritables et surveillez les non lus.';
      return;
    }
    if (url.startsWith('/vendeur/inscription')) {
      this.sectionTitle = 'Inscription vendeur';
      this.sectionDescription = 'Créez un compte vendeur avant validation de votre espace.';
      return;
    }

    this.sectionTitle = 'Connexion vendeur';
    this.sectionDescription = 'Accédez à votre espace vendeur Amaz.';
  }
}
