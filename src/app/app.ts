import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationsComponent } from './shared/components/notifications.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';
import { VendorAuthTokenService } from './core/services/vendor-auth-token.service';
import { VendorSessionStore } from './core/services/vendor-session.store';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsComponent, ConfirmDialogComponent],
    templateUrl: './app.html',
    styleUrls: ['./app.scss']
})
export class App {
    readonly title = signal('vendors');
    private readonly tokenService = inject(VendorAuthTokenService);
    private readonly vendorSession = inject(VendorSessionStore);
    private readonly router = inject(Router);

    get isAuthenticated(): boolean {
        const token = this.tokenService.getToken();
        return !!token && !this.tokenService.isTokenExpired();
    }

    logout(): void {
        this.tokenService.clearToken();
        this.vendorSession.clear();
        this.router.navigate(['/seller/login']);
    }
}



