import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Sidebar } from '../../sidebar/sidebar/sidebar';
import { Topbar } from '../../topbar/topbar/topbar';
import { ConfirmDialog } from '../../../../Shared/confirm-dialog/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Sidebar, Topbar, RouterOutlet, ConfirmDialog],
  templateUrl: './app-shell.html'
})
export class AppShell {

  private readonly router = inject(Router);

  showLogoutConfirm = false;

  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
  }

  closeLogoutConfirm(): void {
    this.showLogoutConfirm = false;
  }

  confirmLogout(): void {
    localStorage.clear();
    this.closeLogoutConfirm();
    this.router.navigate(['/login']);
  }
}
