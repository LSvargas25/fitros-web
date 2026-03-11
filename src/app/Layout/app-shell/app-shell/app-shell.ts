import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../sidebar/sidebar/sidebar';
import { Topbar } from '../../topbar/topbar/topbar';
import { ConfirmDialog } from '../../../Shared/confirm-dialog/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Sidebar, Topbar, RouterOutlet, ConfirmDialog],
  templateUrl: './app-shell.html'
})
export class AppShell {
  sidebarWidth = 288;

  onSidebarWidthChange(width: number): void {
    this.sidebarWidth = width;
  }
}
