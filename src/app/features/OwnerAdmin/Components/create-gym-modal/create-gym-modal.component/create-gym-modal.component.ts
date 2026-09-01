import { Component, output, signal, inject } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, Building2, Phone, MapPin, Link } from 'lucide-angular';
import { GymService }          from '../../../services/gym.service';
import { CreateGymRequest }    from '../../../Models/gym.models';

@Component({
  selector:    'app-create-gym-modal',
  standalone:  true,
  imports:     [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-gym-modal.component.html',
})
export class CreateGymModalComponent {

  readonly gymCreated = output<void>();
  readonly cancelled  = output<void>();

  private readonly gymService = inject(GymService);

  readonly X         = X;
  readonly Building2 = Building2;
  readonly Phone     = Phone;
  readonly MapPin    = MapPin;
  readonly Link      = Link;

  readonly isSaving = signal(false);
  readonly error    = signal<string | null>(null);

  name        = '';
  address     = '';
  phoneNumber = '';
  logoUrl     = '';

  submit(): void {
    this.error.set(null);

    if (!this.name.trim() || !this.address.trim() || !this.phoneNumber.trim()) {
      this.error.set('Name, address and phone are required.');
      return;
    }

    const body: CreateGymRequest = {
      name:        this.name.trim(),
      address:     this.address.trim(),
      phoneNumber: this.phoneNumber.trim(),
      logoUrl:     this.logoUrl.trim() || undefined,
    };

    this.isSaving.set(true);

    this.gymService.create(body).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.gymCreated.emit();
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
