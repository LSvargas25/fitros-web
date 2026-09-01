import { Component, Input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, User, Mail } from 'lucide-angular';
import { UserService, UpdateUserDto } from '../../services/user.service';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-user-modal.component.html',
})
export class EditUserModalComponent implements OnInit {
  @Input({ required: true }) userId!: string;
  @Input({ required: true }) initialFirstName!: string;
  @Input({ required: true }) initialLastName!: string;
  @Input({ required: true }) initialEmail!: string;

  readonly updated   = output<void>();
  readonly cancelled = output<void>();

  private readonly userService = inject(UserService);

  readonly X    = X;
  readonly User = User;
  readonly Mail = Mail;

  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);

  firstName = '';
  lastName  = '';
  email     = '';

  ngOnInit(): void {
    this.firstName = this.initialFirstName;
    this.lastName  = this.initialLastName;
    this.email     = this.initialEmail;
  }

  submit(): void {
    this.error.set(null);

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim()) {
      this.error.set('All fields are required.');
      return;
    }

    const dto: UpdateUserDto = {
      firstName: this.firstName.trim(),
      lastName:  this.lastName.trim(),
      email:     this.email.trim(),
    };

    this.isSaving.set(true);
    this.userService.updateUser(this.userId, dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.updated.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.detail ?? 'Failed to update user.');
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
