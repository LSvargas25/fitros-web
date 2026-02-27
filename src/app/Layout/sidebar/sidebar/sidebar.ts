import { Component, inject, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { filter, Subscription } from 'rxjs';
import { DialogService } from '../../../Core/Dialog/dialog.service';
import { CommonModule } from '@angular/common';
import { SessionFacade } from '../../../Core/Auth/session-facade';

type GroupKey = 'training' | 'nutrition' | 'progress' | 'clients';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);
  private readonly session = inject(SessionFacade);

  @Output() widthChange = new EventEmitter<number>();

  readonly EXPANDED_WIDTH = 288;
  readonly COLLAPSED_WIDTH = 80;

  collapsed = false;
  pinned = true;
  hoveringSidebar = false;

  private readonly subs = new Subscription();
  private hasUserInteracted = false;

  private openGroups: Record<GroupKey, boolean> = {
    training: false,
    nutrition: false,
    progress: false,
    clients: false,
  };

  private hoverGroups: Record<GroupKey, boolean> = {
    training: false,
    nutrition: false,
    progress: false,
    clients: false,
  };

  get role() {
    return this.session.role;
  }

  canManageClients(): boolean {
    return this.role === 'Admin' || this.role === 'Coach';
  }

  ngOnInit(): void {
    this.subs.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(e => this.syncGroupsWithRoute(e.urlAfterRedirects))
    );

    this.emitWidth();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleCollapsed(): void {
    this.pinned = !this.pinned;

    if (!this.pinned) {
      this.collapsed = true;
    } else {
      this.collapsed = false;
    }

    this.emitWidth();
  }

  onSidebarEnter(): void {
    this.hoveringSidebar = true;

    if (!this.pinned) {
      this.collapsed = false;
      this.emitWidth();
    }
  }

  onSidebarLeave(): void {
    this.hoveringSidebar = false;

    if (!this.pinned) {
      this.collapsed = true;
      this.emitWidth();
    }
  }

  shouldShowSidebar(): boolean {
    if (this.pinned) return true;
    return this.hoveringSidebar;
  }

  get sidebarWidth(): number {
    return this.shouldShowSidebar() && !this.collapsed
      ? this.EXPANDED_WIDTH
      : this.COLLAPSED_WIDTH;
  }

  toggleGroup(key: GroupKey): void {
    this.hasUserInteracted = true;

    const isOpen = this.openGroups[key];

    Object.keys(this.openGroups).forEach(k => {
      this.openGroups[k as GroupKey] = false;
    });

    this.openGroups[key] = !isOpen;
  }

  setHover(key: GroupKey, value: boolean): void {
    this.hoverGroups[key] = value;
  }

  isGroupHovered(key: GroupKey): boolean {
    return this.hoverGroups[key];
  }

  isGroupOpen(key: GroupKey): boolean {
    if (!this.hasUserInteracted) return false;

    const clickedOpen = this.openGroups[key];
    const hoveredOpen = this.hoverGroups[key];

    return clickedOpen || (!clickedOpen && hoveredOpen);
  }

  isExactActive(path: string): boolean {
    return this.router.url === path;
  }

  isClientsActive(): boolean {
    return this.router.url.startsWith('/clients');
  }

  isTrainingActive(): boolean {
    return this.router.url.startsWith('/routines') || this.router.url.startsWith('/exercises');
  }

  isNutritionActive(): boolean {
    return this.router.url.startsWith('/meal-plans') || this.router.url.startsWith('/foods');
  }

  isProgressActive(): boolean {
    return this.router.url.startsWith('/measures') || this.router.url.startsWith('/reports');
  }

  private syncGroupsWithRoute(_: string): void {}

  private emitWidth(): void {
    this.widthChange.emit(this.sidebarWidth);
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
