import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, Users, Search, Filter, UserX, UserCheck, Pencil, Trash2 } from 'lucide-angular';
import { UserService, ClientListItem } from '../../../OwnerAdmin/services/user.service';
import { GymService } from '../../../OwnerAdmin/services/gym.service';
import { GymListItemResponse } from '../../../OwnerAdmin/Models/gym.models';
import { DialogService } from '../../../../core/Dialog/dialog.service';
import { CreateUserModalComponent } from '../../../OwnerAdmin/Components/create-user-modal/create-user-modal.component';
import { EditUserModalComponent } from '../../../OwnerAdmin/Components/edit-user-modal/edit-user-modal.component';

@Component({
  selector: 'app-client-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CreateUserModalComponent, EditUserModalComponent],
  templateUrl: './client-list.page.html',
})
export class ClientPage implements OnInit {
  private readonly userService   = inject(UserService);
  private readonly gymService    = inject(GymService);
  private readonly dialogService = inject(DialogService);

  readonly Plus      = Plus;
  readonly Users     = Users;
  readonly Search    = Search;
  readonly Filter    = Filter;
  readonly UserX     = UserX;
  readonly UserCheck = UserCheck;
  readonly Pencil    = Pencil;
  readonly Trash2    = Trash2;

  readonly isLoading   = signal(true);
  readonly clients     = signal<ClientListItem[]>([]);
  readonly gyms        = signal<GymListItemResponse[]>([]);
  readonly error       = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  // Filters — signals (zoneless app); `filteredClients` is read by a structural @if/@for.
  readonly searchValue  = signal('');
  readonly gymFilter    = signal('');
  readonly statusFilter = signal('');

  get filteredClients(): ClientListItem[] {
    const s = this.searchValue().toLowerCase();
    return this.clients().filter(c =>
      (!s || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(s)) &&
      (!this.gymFilter()   || c.gymId === this.gymFilter()) &&
      (!this.statusFilter() || c.status === this.statusFilter())
    );
  }

  // Modals
  readonly showCreateModal = signal(false);
  readonly editingClient   = signal<ClientListItem | null>(null);

  readonly activeGyms = computed(() => this.gyms().filter(g => g.isActive));

  ngOnInit(): void {
    this.gymService.getAll().subscribe({ next: (g) => this.gyms.set(g), error: () => {} });
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.userService.getClients().subscribe({
      next: (list) => {
        this.clients.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load clients.');
        this.isLoading.set(false);
      },
    });
  }



  // ── Modals ─────────────────────────────────────────────────────────────────
  openCreate(): void  { this.showCreateModal.set(true); }
  closeCreate(): void { this.showCreateModal.set(false); }

  onClientCreated(): void {
    this.showCreateModal.set(false);
    this.loadClients();
  }

  openEdit(client: ClientListItem): void  { this.editingClient.set(client); }
  closeEdit(): void                        { this.editingClient.set(null); }

  onClientUpdated(): void {
    this.editingClient.set(null);
    this.loadClients();
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async toggleActive(client: ClientListItem): Promise<void> {
    const isActive = client.status === 'Active';
    const confirmed = await this.dialogService.confirm({
      title:       isActive ? 'Deactivate Client' : 'Activate Client',
      message:     isActive
        ? `Deactivate ${client.firstName} ${client.lastName}?`
        : `Activate ${client.firstName} ${client.lastName}?`,
      confirmText: isActive ? 'Deactivate' : 'Activate',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    const action$ = isActive
      ? this.userService.deactivateUser(client.id)
      : this.userService.activateUser(client.id);

    action$.subscribe({
      next:  () => this.loadClients(),
      error: (err) => {
        const msg = err?.error?.detail ?? 'Operation failed.';
        this.actionError.set(msg);
      },
    });
  }

  async hardDelete(client: ClientListItem): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title:       'Delete Client Permanently',
      message:     `Permanently delete ${client.firstName} ${client.lastName}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    this.userService.hardDeleteUser(client.id).subscribe({
      next:  () => this.loadClients(),
      error: (err) => {
        const msg = err?.error?.detail ?? 'Operation failed.';
        this.actionError.set(msg);
      },
    });
  }

  getGymName(gymId: string | null | undefined): string {
    if (!gymId) return '—';
    return this.gyms().find(g => g.id === gymId)?.name ?? gymId;
  }
}
