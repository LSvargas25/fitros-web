import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Plus, Users, Building2, Mail, User, Lock, ChevronDown } from 'lucide-angular';
import { UserService, AdminUser, CreateAdminDto } from '../../services/user.service';
import { GymService } from '../../services/gym.service';
import { GymListItemResponse } from '../../Models/gym.models';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-management.component.html',
})
export class AdminManagementComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly gymService  = inject(GymService);

  readonly Plus         = Plus;
  readonly Users        = Users;
  readonly Building2    = Building2;
  readonly Mail         = Mail;
  readonly User         = User;
  readonly Lock         = Lock;
  readonly ChevronDown  = ChevronDown;

  readonly isLoading   = signal(true);
  readonly admins      = signal<AdminUser[]>([]);
  readonly gyms        = signal<GymListItemResponse[]>([]);
  readonly error       = signal<string | null>(null);

  // Create admin form
  readonly showCreateForm = signal(false);
  readonly isSaving       = signal(false);
  readonly createError    = signal<string | null>(null);

  newEmail     = '';
  newFirstName = '';
  newLastName  = '';
  newPassword  = '';

  // Assign gym
  readonly assigningAdminId = signal<string | null>(null);
  assignGymValue            = '';

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
      error: (err) => {
        this.error.set('Failed to load admins.');
        this.isLoading.set(false);
      },
    });
  }

  getGymName(gymId: string | null | undefined): string {
    if (!gymId) return 'Unassigned';
    const gym = this.gyms().find(g => g.id === gymId);
    return gym?.name ?? 'Unknown';
  }

  availableGyms = computed(() => this.gyms().filter(g => g.isActive));

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
        this.createError.set(err?.error?.detail ?? 'Failed to create admin.');
      },
    });
  }

  startAssign(adminId: string): void {
    this.assigningAdminId.set(adminId);
    this.assignGymValue = '';
  }

  cancelAssign(): void {
    this.assigningAdminId.set(null);
    this.assignGymValue = '';
  }

  confirmAssign(adminId: string): void {
    const gymId = this.assignGymValue;
    if (!gymId) return;

    this.userService.assignAdminToGym(adminId, gymId).subscribe({
      next: () => {
        this.assigningAdminId.set(null);
        this.assignGymValue = '';
        this.loadData();
      },
      error: (err) => {
        console.error('[Admin] Failed to assign gym', err);
      },
    });
  }
}
