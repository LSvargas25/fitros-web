import { Component, Input, OnInit, output, signal, computed, inject } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, UserCheck, Building2 } from 'lucide-angular';
import { UserService, AdminUser } from '../../services/user.service';
import { GymService }             from '../../services/gym.service';

@Component({
  selector:    'app-assign-admin-modal',
  standalone:  true,
  imports:     [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './assign-admin-modal.component.html',
})
export class AssignAdminModalComponent implements OnInit {
  @Input({ required: true }) gymId!: string;
  @Input({ required: true }) gymName!: string;

  readonly assigned  = output<void>();
  readonly cancelled = output<void>();

  private readonly userService = inject(UserService);
  private readonly gymService  = inject(GymService);

  readonly X          = X;
  readonly UserCheck  = UserCheck;
  readonly Building2  = Building2;

  readonly isLoading = signal(true);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);
  readonly allAdmins = signal<AdminUser[]>([]);

  readonly unassignedAdmins = computed(() =>
    this.allAdmins().filter(a => !a.gymId)
  );

  selectedAdminId = '';

  ngOnInit(): void {
    this.userService.getAdmins().subscribe({
      next: (admins) => {
        this.allAdmins.set(admins);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load admins.');
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    if (!this.selectedAdminId) {
      this.error.set('Please select an admin.');
      return;
    }

    this.error.set(null);
    this.isSaving.set(true);

    this.gymService.assignAdmin(this.gymId, this.selectedAdminId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.assigned.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.detail ?? 'Failed to assign admin.');
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
