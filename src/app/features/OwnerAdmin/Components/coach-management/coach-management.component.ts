import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, Users, Mail, User, Lock, Pencil, Trash2, UserX, UserCheck, Building2, ChevronDown } from 'lucide-angular';
import { UserService, CoachUser, CreateUserDto } from '../../services/user.service';
import { GymService }          from '../../services/gym.service';
import { GymListItemResponse } from '../../Models/gym.models';
import { DialogService }       from '../../../../Core/Dialog/dialog.service';
import { EditUserModalComponent } from '../edit-user-modal/edit-user-modal.component';

@Component({
  selector:    'app-coach-management',
  standalone:  true,
  imports:     [CommonModule, FormsModule, LucideAngularModule, EditUserModalComponent],
  templateUrl: './coach-management.component.html',
})
export class CoachManagementComponent implements OnInit {
  private readonly userService   = inject(UserService);
  private readonly gymService    = inject(GymService);
  private readonly dialogService = inject(DialogService);

  readonly Plus        = Plus;
  readonly Users       = Users;
  readonly Mail        = Mail;
  readonly User        = User;
  readonly Lock        = Lock;
  readonly Pencil      = Pencil;
  readonly Trash2      = Trash2;
  readonly UserX       = UserX;
  readonly UserCheck   = UserCheck;
  readonly Building2   = Building2;
  readonly ChevronDown = ChevronDown;

  readonly isLoading      = signal(true);
  readonly coaches        = signal<CoachUser[]>([]);
  readonly gyms           = signal<GymListItemResponse[]>([]);
  readonly error          = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly isSaving       = signal(false);
  readonly createError    = signal<string | null>(null);

  newEmail     = '';
  newFirstName = '';
  newLastName  = '';
  newPassword  = '';

  // Assign gym
  readonly assigningCoachId = signal<string | null>(null);
  assignGymValue            = '';
  readonly assignError      = signal<string | null>(null);
  readonly assignSuccess    = signal<string | null>(null);

  readonly editingCoach = signal<CoachUser | null>(null);

  readonly availableGyms = computed(() => this.gyms().filter(g => g.isActive));

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

    this.userService.getCoaches().subscribe({
      next: (coaches) => {
        this.coaches.set(coaches);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load coaches.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  createCoach(): void {
    this.createError.set(null);

    if (!this.newEmail.trim() || !this.newFirstName.trim() ||
        !this.newLastName.trim() || !this.newPassword.trim()) {
      this.createError.set('All fields are required.');
      return;
    }

    const dto: CreateUserDto = {
      email:     this.newEmail.trim(),
      firstName: this.newFirstName.trim(),
      lastName:  this.newLastName.trim(),
      password:  this.newPassword,
    };

    this.isSaving.set(true);
    this.userService.createCoach(dto).subscribe({
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
        this.createError.set(err?.detail ?? 'Failed to create coach.');
      },
    });
  }

  // ── Assign gym ─────────────────────────────────────────────────────────────
  startAssign(coachId: string): void {
    this.assigningCoachId.set(coachId);
    this.assignGymValue = '';
    this.assignError.set(null);
    this.assignSuccess.set(null);
  }

  cancelAssign(): void {
    this.assigningCoachId.set(null);
    this.assignGymValue = '';
    this.assignError.set(null);
    this.assignSuccess.set(null);
  }

  confirmAssign(coachId: string): void {
    const gymId = this.assignGymValue;
    if (!gymId) return;

    this.assignError.set(null);
    this.assignSuccess.set(null);

    this.gymService.assignCoach(gymId, coachId).subscribe({
      next: () => {
        this.assignSuccess.set('Gym assigned successfully.');
        this.assigningCoachId.set(null);
        this.assignGymValue = '';
        this.loadData();
      },
      error: (err) => {
        this.assignError.set(err?.detail ?? 'Failed to assign gym.');
      },
    });
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  openEdit(coach: CoachUser): void  { this.editingCoach.set(coach); }
  closeEdit(): void                 { this.editingCoach.set(null);  }
  onCoachUpdated(): void {
    this.editingCoach.set(null);
    this.loadData();
  }

  // ── Deactivate / Activate ──────────────────────────────────────────────────
  async toggleActive(coach: CoachUser): Promise<void> {
    const isActive = coach.status === 'Active';
    const confirmed = await this.dialogService.confirm({
      title:       isActive ? 'Deactivate Coach' : 'Activate Coach',
      message:     isActive
        ? `Deactivate ${coach.firstName} ${coach.lastName}? They will lose access.`
        : `Activate ${coach.firstName} ${coach.lastName}?`,
      confirmText: isActive ? 'Deactivate' : 'Activate',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    const action$ = isActive
      ? this.userService.deactivateCoach(coach.id)
      : this.userService.activateCoach(coach.id);

    action$.subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Coach] Toggle active failed', err),
    });
  }

  // ── Hard delete ────────────────────────────────────────────────────────────
  async hardDelete(coach: CoachUser): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title:       'Delete Coach Permanently',
      message:     `Permanently delete ${coach.firstName} ${coach.lastName}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText:  'Cancel',
    });
    if (!confirmed) return;

    this.userService.deleteCoach(coach.id).subscribe({
      next:  () => this.loadData(),
      error: (err) => console.error('[Coach] Hard delete failed', err),
    });
  }
}
