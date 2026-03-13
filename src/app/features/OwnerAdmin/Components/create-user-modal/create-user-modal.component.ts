import { Component, Input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, User, Mail, Lock, Building2 } from 'lucide-angular';
import { UserService, CreateUserDto, CreateClientDto } from '../../services/user.service';
import { GymListItemResponse } from '../../Models/gym.models';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-user-modal.component.html',
})
export class CreateUserModalComponent {
  @Input({ required: true }) userType!: 'client' | 'coach';
  /** Pass active gyms to show a gym selector when creating a client (OwnerApp only). */
  @Input() gyms: GymListItemResponse[] = [];

  readonly userCreated = output<void>();
  readonly cancelled   = output<void>();

  private readonly userService = inject(UserService);

  readonly X         = X;
  readonly User      = User;
  readonly Mail      = Mail;
  readonly Lock      = Lock;
  readonly Building2 = Building2;

  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);

  email     = '';
  firstName = '';
  lastName  = '';
  password  = '';
  gymId     = '';

  get title(): string {
    return this.userType === 'client' ? 'New Client' : 'New Coach';
  }

  get showGymSelect(): boolean {
    return this.userType === 'client' && this.gyms.length > 0;
  }

  submit(): void {
    this.error.set(null);

    if (!this.email.trim() || !this.firstName.trim() ||
        !this.lastName.trim() || !this.password.trim()) {
      this.error.set('All fields are required.');
      return;
    }

    if (this.showGymSelect && !this.gymId) {
      this.error.set('Please select a gym.');
      return;
    }

    this.isSaving.set(true);

    if (this.userType === 'client') {
      const dto: CreateClientDto = {
        email:     this.email.trim(),
        firstName: this.firstName.trim(),
        lastName:  this.lastName.trim(),
        password:  this.password,
        ...(this.gymId ? { gymId: this.gymId } : {}),
      };
      this.userService.createClient(dto).subscribe({
        next:  () => { this.isSaving.set(false); this.userCreated.emit(); },
        error: (err) => { this.isSaving.set(false); this.error.set(err?.error?.detail ?? 'Failed to create client.'); },
      });
    } else {
      const dto: CreateUserDto = {
        email:     this.email.trim(),
        firstName: this.firstName.trim(),
        lastName:  this.lastName.trim(),
        password:  this.password,
      };
      this.userService.createCoach(dto).subscribe({
        next:  () => { this.isSaving.set(false); this.userCreated.emit(); },
        error: (err) => { this.isSaving.set(false); this.error.set(err?.error?.detail ?? 'Failed to create coach.'); },
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
