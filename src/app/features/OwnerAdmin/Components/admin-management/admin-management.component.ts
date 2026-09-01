import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, Users, Building2, Mail, User, Lock, ChevronDown, Pencil, Trash2, UserX, UserCheck } from 'lucide-angular';
import { UserService, AdminUser, CreateAdminDto } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { GymListItemResponse } from '../../Models/gym.models';
import { DialogService } from '../../../../core/Dialog/dialog.service';
import { EditUserModalComponent } from '../edit-user-modal/edit-user-modal.component';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EditUserModalComponent],
  templateUrl: './admin-management.component.html',
})
export class AdminManagementComponent implements OnInit {
  private readonly userService   = inject(UserService);
  private readonly gymService    = inject(GymService);
  private readonly dialogService = inject(DialogService);

  readonly Plus        = Plus;
  readonly Users       = Users;
  readonly Building2   = Building2;
  readonly Mail        = Mail;
  readonly User        = User;
  readonly Lock        = Lock;
  readonly ChevronDown = ChevronDown;
  readonly Pencil      = Pencil;
  readonly Trash2      = Trash2;
  readonly UserX       = UserX;
  readonly UserCheck   = UserCheck;

  readonly isLoading = signal(true);
  readonly admins    = signal<AdminUser[]>([]);
  readonly gyms      = signal<GymListItemResponse[]>([]);
  readonly error     = signal<string | null>(null);

  // Create admin form
  readonly showCreateForm = signal(false);
  readonly isSaving       = signal(false);
  readonly createError    = signal<string | null>(null);

  // Assign feedback
  readonly assignError   = signal<string | null>(null);
  readonly assignSuccess = signal<string | null>(null);

  newEmail     = '';
  newFirstName = '';
  newLastName  = '';
  newPassword  = '';

  // Assign gym
  readonly assigningAdminId = signal<string | null>(null);
  assignGymValue            = '';

  // Edit modal
  readonly editingAdmin = signal<AdminUser | null>(null);

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

    this.userService.getAdmins().subscribe({
      next: (admins) => {
        this.admins.set(admins);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load admins.');
        this.isLoading.set(false);
      },
    });
  }

  readonly availableGyms = computed(() => this.gyms().filter(g => g.isActive));

  // ── Create ─────────────────────────────────────────────────────────────────
  createAdmin(): void {
    this.createError.set(null);

    if (!this.newEmail.trim() || !this.newFirstName.trim() ||
        !this.newLastName.trim() || !this.newPassword.trim()) {
      this.createError.set('All fields are required.');
      return;
    }

    const dto: CreateAdminDto = {
      email:     this.newEmail.trim(),
      firstName: this.newFirstName.trim(),
      lastName:  this.newLastName.trim(),
      password:  this.newPassword,
    };

    this.isSaving.set(true);
    this.userService.createAdmin(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showCreateForm.set(false);
        this.newEmail = '';
        this.newFirstName = '';
        this.newLastName = '';
        this.newPassword = '';
        this.loadData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.createError.set(err?.detail ?? 'Failed to create admin.');
      },
    });
  }

  // ── Assign gym ─────────────────────────────────────────────────────────────
  startAssign(adminId: string): void {
    this.assigningAdminId.set(adminId);
    this.assignGymValue = '';
  }

  cancelAssign(): void {
    this.assigningAdminId.set(null);
    this.assignGymValue = '';
    this.assignError.set(null);
    this.assignSuccess.set(null);
  }

  confirmAssign(adminId: string): void {
    const gymId = this.assignGymValue;
    if (!gymId) return;

    this.assignError.set(null);
    this.assignSuccess.set(null);

    this.gymService.assignAdmin(gymId, adminId).subscribe({
      next: () => {
        this.assignSuccess.set('Gym assigned successfully.');
        this.assigningAdminId.set(null);
        this.assignGymValue = '';
        this.loadData();
      },
      error: (err) => {
        this.assignError.set(err?.detail ?? 'Failed to assign gym.');
      },
    });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  openEdit(admin: AdminUser): void {
    this.editingAdmin.set(admin);
  }

  closeEdit(): void {
    this.editingAdmin.set(null);
  }

  onAdminUpdated(): void {
    this.editingAdmin.set(null);
    this.loadData();
  }

  // ── Deactivate / Activate ──────────────────────────────────────────────────
  async toggleActive(admin: AdminUser): Promise<void> {
    const isActive = admin.status === 'Active';
    const confirmed = await this.dialogService.confirm({
      title:       isActive ? 'Deactivate Admin' : 'Activate Admin',
      message:     isActive
        ? `Deactivate ${admin.firstName} ${admin.lastName}? They will lose access.`
        : `Activate ${admin.firstName} ${admin.lastName}?`,
      confirmText: isActive ? 'Deactivate' : 'Activate',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    const action$ = isActive
      ? this.userService.deactivateAdmin(admin.id)
      : this.userService.activateAdmin(admin.id);

    action$.subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Admin] Toggle active failed', err),
    });
  }

  // ── Hard delete ────────────────────────────────────────────────────────────
  async hardDelete(admin: AdminUser): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title:       'Delete Admin Permanently',
      message:     `Permanently delete ${admin.firstName} ${admin.lastName}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    this.userService.deleteAdmin(admin.id).subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Admin] Hard delete failed', err),
    });
  }
}
