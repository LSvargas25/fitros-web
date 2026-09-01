import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import { DialogService } from '../../../core/Dialog/dialog.service';
import { SessionFacade, AppRole } from '../../../core/auth/session-facade';
import { NAV_ITEMS, NavItem } from '../sidebar/sidebar-nav';
import { PERMISSIONS, PermissionKey } from '../../../core/auth/route-permissions';

type GroupState = Record<string, boolean>;
type HoverState = Record<string, boolean>;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {

  private permissionCache = new Map<PermissionKey, boolean>();
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

  // estado por key (groups)
  openGroups: GroupState = {};
  hoverGroups: HoverState = {};

  // fuente de verdad del menú
  readonly items: NavItem[] = NAV_ITEMS;

  get role(): AppRole {
    return this.session.role;
  }

  /**
   * `items` with the role-hidden links/groups removed, then dividers tidied so a
   * hidden group can't leave two rules stacked (or a rule at the very top/bottom).
   * Drives the template — see `canSee` for the per-item permission check.
   */
  get visibleItems(): NavItem[] {
    const shown = this.items.filter((it) =>
      it.kind === 'divider' ? true : this.canSee(it.permission),
    );

    const out: NavItem[] = [];
    for (const it of shown) {
      if (it.kind === 'divider' && (out.length === 0 || out[out.length - 1].kind === 'divider')) {
        continue; // skip a leading divider or a second consecutive one
      }
      out.push(it);
    }
    while (out.length && out[out.length - 1].kind === 'divider') out.pop(); // trailing

    return out;
  }

  ngOnInit(): void {
      this.permissionCache.clear();
    for (const item of this.items) {
      if (item.kind === 'group') {
        this.openGroups[item.key] = false;
        this.hoverGroups[item.key] = false;
      }
    }

    this.subs.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          // opcional: podrías auto-abrir el grupo activo si quieres
          // aquí lo dejamos simple
        })
    );

    this.emitWidth();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ============================
  // VISIBILITY / PERMISSIONS
  // ============================
canSee(permission?: PermissionKey): boolean {
  if (!permission) return true;

  // cache hit
  if (this.permissionCache.has(permission)) {
    return this.permissionCache.get(permission)!;
  }

  const allowedRoles = PERMISSIONS[permission];
  const result = allowedRoles.includes(this.role);

  this.permissionCache.set(permission, result);

  return result;
}

  // ============================
  // ACTIVE CHECK
  // ============================
  isActiveStartsWith(prefix?: string): boolean {
    if (!prefix) return false;
    return this.router.url.startsWith(prefix);
  }

  // ============================
  // GROUP UI
  // ============================
  toggleGroup(key: string): void {
    this.hasUserInteracted = true;

    const isOpen = !!this.openGroups[key];

    Object.keys(this.openGroups).forEach(k => (this.openGroups[k] = false));
    this.openGroups[key] = !isOpen;
  }

  setHover(key: string, value: boolean): void {
    this.hoverGroups[key] = value;
  }

  isGroupOpen(key: string): boolean {
    if (!this.hasUserInteracted) return false;
    return !!this.openGroups[key] || (!!this.hoverGroups[key] && !this.openGroups[key]);
  }

  isGroupHovered(key: string): boolean {
    return !!this.hoverGroups[key];
  }

  // ============================
  // COLLAPSE / PIN
  // ============================
  toggleCollapsed(): void {
    this.pinned = !this.pinned;
    this.collapsed = !this.pinned;
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

  private shouldShowSidebar(): boolean {
    if (this.pinned) return true;
    return this.hoveringSidebar;
  }

  get sidebarWidth(): number {
    return this.shouldShowSidebar() && !this.collapsed
      ? this.EXPANDED_WIDTH
      : this.COLLAPSED_WIDTH;
  }

  private emitWidth(): void {
    this.widthChange.emit(this.sidebarWidth);
  }

  // ============================
  // LOGOUT
  // ============================
  async requestLogout(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to sign out of FitRos?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    this.session.logout();
  }

  // ============================
  // HELPERS FOR TEMPLATE
  // ============================
  isGroupActive(item: Extract<NavItem, { kind: 'group' }>): boolean {
    return item.items.some(i => this.isActiveStartsWith(i.activeStartsWith ?? i.route));
  }

  getSubItemClass(accent?: 'default' | 'success' | 'warning'): string {
    switch (accent) {
      case 'success':
        return 'text-emerald-300 hover:bg-emerald-500/20';
      case 'warning':
        return 'text-amber-300 hover:bg-amber-500/20';
      default:
        return 'text-white/85 hover:bg-white/10';
    }
  }
}
