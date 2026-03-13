import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, Users, Mail, User, Lock, Pencil, Trash2, UserX, UserCheck, Building2 } from 'lucide-angular';
import { UserService, ClientListItem, CreateClientDto } from '../../services/user.service';
import { GymService }          from '../../services/gym.service';
import { GymListItemResponse } from '../../Models/gym.models';
import { DialogService }       from '../../../../Core/Dialog/dialog.service';
import { EditUserModalComponent } from '../edit-user-modal/edit-user-modal.component';

@Component({
  selector:    'app-client-management',
  standalone:  true,
  imports:     [CommonModule, FormsModule, LucideAngularModule, EditUserModalComponent],
  templateUrl: './client-management.component.html',
})
export class ClientManagementComponent implements OnInit {
  private readonly userService   = inject(UserService);
  private readonly gymService    = inject(GymService);
  private readonly dialogService = inject(DialogService);

  readonly Plus      = Plus;
  readonly Users     = Users;
  readonly Mail      = Mail;
  readonly User      = User;
  readonly Lock      = Lock;
  readonly Pencil    = Pencil;
  readonly Trash2    = Trash2;
  readonly UserX     = UserX;
  readonly UserCheck = UserCheck;
  readonly Building2 = Building2;

  readonly isLoading      = signal(true);
  readonly clients        = signal<ClientListItem[]>([]);
  readonly gyms           = signal<GymListItemResponse[]>([]);
  readonly error          = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly isSaving       = signal(false);
  readonly createError    = signal<string | null>(null);

  newEmail     = '';
  newFirstName = '';
  newLastName  = '';
  newPassword  = '';
  newGymId     = '';

  readonly editingClient = signal<ClientListItem | null>(null);

  readonly activeGyms = computed(() => this.gyms().filter(g => g.isActive));

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.gymService.getAll().subscribe({
      next: (gyms) => this.gyms.set(gyms),
      error: () => {},
    });

    this.userService.getClients().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load clients.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  createClient(): void {
    this.createError.set(null);

    if (!this.newEmail.trim() || !this.newFirstName.trim() ||
        !this.newLastName.trim() || !this.newPassword.trim()) {
      this.createError.set('First name, last name, email and password are required.');
      return;
    }

    const dto: CreateClientDto = {
      email:     this.newEmail.trim(),
      firstName: this.newFirstName.trim(),
      lastName:  this.newLastName.trim(),
      password:  this.newPassword,
      gymId:     this.newGymId || undefined,
    };

    this.isSaving.set(true);
    this.userService.createClient(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showCreateForm.set(false);
        this.newEmail = '';
        this.newFirstName = '';
        this.newLastName = '';
        this.newPassword = '';
        this.newGymId = '';
        this.loadData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.createError.set(err?.detail ?? 'Failed to create client.');
      },
    });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  openEdit(client: ClientListItem): void  { this.editingClient.set(client); }
  closeEdit(): void                       { this.editingClient.set(null);   }
  onClientUpdated(): void {
    this.editingClient.set(null);
    this.loadData();
  }

  // ── Deactivate / Activate ──────────────────────────────────────────────────
  async toggleActive(client: ClientListItem): Promise<void> {
    const isActive = client.status === 'Active';
    const confirmed = await this.dialogService.confirm({
      title:       isActive ? 'Deactivate Client' : 'Activate Client',
      message:     isActive
        ? `Deactivate ${client.firstName} ${client.lastName}? They will lose access.`
        : `Activate ${client.firstName} ${client.lastName}?`,
      confirmText: isActive ? 'Deactivate' : 'Activate',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    const action$ = isActive
      ? this.userService.deactivateClient(client.id)
      : this.userService.activateClient(client.id);

    action$.subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Client] Toggle active failed', err),
    });
  }

  // ── Hard delete ────────────────────────────────────────────────────────────
  async hardDelete(client: ClientListItem): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title:       'Delete Client Permanently',
      message:     `Permanently delete ${client.firstName} ${client.lastName}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    this.userService.deleteClient(client.id).subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Client] Hard delete failed', err),
    });
  }
}
