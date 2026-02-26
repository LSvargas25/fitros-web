import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Settings, LogOut } from 'lucide-angular';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  @Output() logoutRequested = new EventEmitter<void>();

  requestLogout(): void {
    this.logoutRequested.emit();
  }
}
