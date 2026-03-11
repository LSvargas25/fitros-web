import { Component, Input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, User, Mail, Lock } from 'lucide-angular';
import { UserService, CreateUserDto } from '../../services/user.service';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-user-modal.component.html',
})
export class CreateUserModalComponent {
  @Input({ required: true }) userType!: 'client' | 'coach';

  readonly userCreated = output<void>();
  readonly cancelled   = output<void>();

  private readonly userService = inject(UserService);

  readonly X    = X;
  readonly User = User;
  readonly Mail = Mail;
  readonly Lock = Lock;

  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);

  email     = '';
  firstName = '';
  lastName  = '';
  password  = '';

  get title(): string {
    return this.userType === 'client' ? 'New Client' : 'New Coach';
  }

  submit(): void {
    this.error.set(null);

    if (!this.email.trim() || !this.firstName.trim() ||
        !this.lastName.trim() || !this.password.trim()) {
      this.error.set('All fields are required.');
      return;
    }

    const dto: CreateUserDto = {
      email:     this.email.trim(),
      firstName: this.firstName.trim(),
      lastName:  this.lastName.trim(),
      password:  this.password,
    };

    this.isSaving.set(true);

    const request$ = this.userType === 'client'
      ? this.userService.createClient(dto)
      : this.userService.createCoach(dto);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.userCreated.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.detail ?? `Failed to create ${this.userType}.`);
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
