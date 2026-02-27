import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose
} from 'lucide-angular';
import { DialogService } from '../../../Core/Dialog/dialog.service';

type GroupKey = 'training' | 'nutrition' | 'progress';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);

  collapsed = false;

  private openGroups: Record<GroupKey, boolean> = {
    training: false,
    nutrition: false,
    progress: false,
  };

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  toggleGroup(key: GroupKey): void {
    this.openGroups[key] = !this.openGroups[key];
  }

  isGroupOpen(key: GroupKey): boolean {
    return this.openGroups[key];
  }

  isTrainingActive(): boolean {
    return this.router.url.startsWith('/routines') || this.router.url.startsWith('/exercises');
  }

  isNutritionActive(): boolean {
    return this.router.url.startsWith('/meal-plans') || this.router.url.startsWith('/foods');
  }

  isProgressActive(): boolean {
    return this.router.url.startsWith('/measurements') || this.router.url.startsWith('/reports');
  }

  async requestLogout(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out of FitRos?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
