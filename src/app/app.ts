import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationsComponent } from './shared/components/notifications.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsComponent, ConfirmDialogComponent],
    templateUrl: './app.html',
    styleUrls: ['./app.scss']
})
export class App {
    readonly title = signal('vendors');

}



