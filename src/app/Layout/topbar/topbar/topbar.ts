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
import { map } from 'rxjs/operators';

import { SessionFacade } from '../../../Core/Auth/session-facade';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly session = inject(SessionFacade);

  @Output() menuClick = new EventEmitter<void>();
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

  private readonly _searchTerm = signal('');
  private readonly _showSearch = signal(true);
  private readonly _notifications = signal(3);
  private readonly _dropdownOpen = signal(false);
  private readonly _avatarError = signal(false);

  readonly title = computed(() => this.routeData()['title'] ?? '');
  readonly subtitle = computed(() => this.routeData()['subtitle']);

  readonly searchTerm = computed(() => this._searchTerm());
  readonly showSearch = computed(() => this._showSearch());
  readonly notificationCount = computed(() => this._notifications());
  readonly dropdownOpen = computed(() => this._dropdownOpen());
  readonly avatarError = computed(() => this._avatarError());

  readonly userName = computed(() => this.session.userName ?? 'User');
  readonly userRole = computed(() => this.session.role);
  readonly userAvatarUrl = computed(() => this.session.userAvatarUrl ?? null);

  readonly userInitials = computed(() => {
    const name = this.userName();
    if (!name) return '?';
    return name
      .split(' ')
      .map(x => x[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  toggleSearch(): void {
    this._showSearch.update(v => !v);
  }

  setSearch(value: string): void {
    this._searchTerm.set(value);
  }

  onSearch(): void {
    console.log('Search:', this._searchTerm());
  }

  toggleDropdown(): void {
    this._dropdownOpen.update(v => !v);
  }

  closeDropdown(): void {
    this._dropdownOpen.set(false);
  }

  onAvatarError(): void {
    this._avatarError.set(true);
  }

  onProfileClick(): void {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  onLogout(): void {
    this.session.logout();
  }

  onChangeAvatar(): void {
    this.changeAvatarClick.emit();
    this.closeDropdown();
  }

  incrementNotifications(): void {
    this._notifications.update(v => v + 1);
  }

  clearNotifications(): void {
    this._notifications.set(0);
  }
}
