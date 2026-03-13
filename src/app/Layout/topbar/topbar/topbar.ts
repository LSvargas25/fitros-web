import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { SessionFacade } from '../../../Core/Auth/session-facade';
import { NotificationService, NotificationDto } from '../../../features/OwnerAdmin/services/notification.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly router              = inject(Router);
  private readonly route               = inject(ActivatedRoute);
  private readonly session             = inject(SessionFacade);
  private readonly notificationService = inject(NotificationService);

  @Output() menuClick         = new EventEmitter<void>();
  @Output() changeAvatarClick = new EventEmitter<void>();

  private readonly routeData = toSignal(
    this.router.events.pipe(
      map(() => {
        let current: ActivatedRoute | null = this.route;
        while (current?.firstChild) current = current.firstChild;
        return current?.snapshot?.data ?? {};
      })
    ),
    { initialValue: this.route.snapshot.data ?? {} }
  );

  private readonly _searchTerm    = signal('');
  private readonly _showSearch    = signal(true);
  private readonly _dropdownOpen  = signal(false);
  private readonly _avatarError   = signal(false);
  private readonly _showNotifPanel = signal(false);
  private readonly _notifList      = signal<NotificationDto[]>([]);

  readonly title    = computed(() => this.routeData()['title'] ?? '');
  readonly subtitle = computed(() => this.routeData()['subtitle']);

  readonly searchTerm       = computed(() => this._searchTerm());
  readonly showSearch       = computed(() => this._showSearch());
  readonly dropdownOpen     = computed(() => this._dropdownOpen());
  readonly avatarError      = computed(() => this._avatarError());
  readonly showNotifPanel   = computed(() => this._showNotifPanel());
  readonly notifications    = computed(() => this._notifList());
  readonly notificationCount = computed(() => this._notifList().length);

  readonly userName      = computed(() => this.session.userName ?? 'User');
  readonly userRole      = computed(() => this.session.role);
  readonly userAvatarUrl = computed(() => this.session.userAvatarUrl ?? null);

  readonly userInitials = computed(() => {
    const name = this.userName();
    if (!name) return '?';
    return name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  });

  constructor() {
    // Poll for unread notifications every 30s, starting immediately.
    interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getUnread().pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe(notifs => this._notifList.set(notifs));
  }

  toggleSearch(): void { this._showSearch.update(v => !v); }
  setSearch(value: string): void { this._searchTerm.set(value); }
  onSearch(): void { console.log('Search:', this._searchTerm()); }

  toggleDropdown(): void {
    this._dropdownOpen.update(v => !v);
    if (this._dropdownOpen()) this._showNotifPanel.set(false);
  }

  closeDropdown(): void { this._dropdownOpen.set(false); }

  onAvatarError(): void { this._avatarError.set(true); }

  onProfileClick(): void {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  onLogout(): void { this.session.logout(); }

  onChangeAvatar(): void {
    this.changeAvatarClick.emit();
    this.closeDropdown();
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  onBellClick(): void {
    this._showNotifPanel.update(v => !v);
    if (this._showNotifPanel()) this._dropdownOpen.set(false);
  }

  closeNotifPanel(): void { this._showNotifPanel.set(false); }

  onNotifClick(notif: NotificationDto): void {
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => {
        this._notifList.update(list => list.filter(n => n.id !== notif.id));
        if (notif.referenceId) {
          this.router.navigate(['/owner-admins']);
        }
      },
    });
    this._showNotifPanel.set(false);
  }

  onDeleteNotif(notif: NotificationDto, event: Event): void {
    event.stopPropagation();
    this.notificationService.delete(notif.id).subscribe({
      next: () => this._notifList.update(list => list.filter(n => n.id !== notif.id)),
    });
  }
}
