import { Component, output, signal, inject } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, Building2, User, Phone, MapPin, Lock, Mail, Link } from 'lucide-angular';
import { GymService }          from '../../../services/gym.service';
import { CreateGymRequest }    from '../../../Models/gym.models';

@Component({
  selector:    'app-create-gym-modal',
  standalone:  true,
  imports:     [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-gym-modal.component.html',
})
export class CreateGymModalComponent {

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly gymCreated = output<void>();
  readonly cancelled  = output<void>();

  // ── Deps ──────────────────────────────────────────────────────────────────
  private readonly gymService = inject(GymService);

  // ── Icons ─────────────────────────────────────────────────────────────────
  readonly X         = X;
  readonly Building2 = Building2;
  readonly User      = User;
  readonly Phone     = Phone;
  readonly MapPin    = MapPin;
  readonly Lock      = Lock;
  readonly Mail      = Mail;
  readonly Link      = Link;

  // ── State ─────────────────────────────────────────────────────────────────
  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  name           = '';
  address        = '';
  phoneNumber    = '';
  logoUrl        = '';
  adminEmail     = '';
  adminFirstName = '';
  adminLastName  = '';
  adminPassword  = '';

  // ── Actions ───────────────────────────────────────────────────────────────
  submit(): void {
    this.error.set(null);

    if (!this.name.trim()           ||
        !this.address.trim()        ||
        !this.phoneNumber.trim()    ||
        !this.adminEmail.trim()     ||
        !this.adminFirstName.trim() ||
        !this.adminLastName.trim()  ||
        !this.adminPassword.trim()) {
      this.error.set('All fields are required.');
      return;
    }

    const body: CreateGymRequest = {
      name:           this.name.trim(),
      address:        this.address.trim(),
      phoneNumber:    this.phoneNumber.trim(),
      logoUrl:        this.logoUrl.trim() || undefined,
      adminEmail:     this.adminEmail.trim(),
      adminFirstName: this.adminFirstName.trim(),
      adminLastName:  this.adminLastName.trim(),
      adminPassword:  this.adminPassword,
    };

    this.isSaving.set(true);

    this.gymService.create(body).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.gymCreated.emit();   // el page escucha esto y recarga
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.detail ?? 'Failed to create gym.');
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
