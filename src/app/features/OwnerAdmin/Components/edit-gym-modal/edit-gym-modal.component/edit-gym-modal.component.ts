import { Component, Input, OnInit, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { X, Building2, MapPin, Phone, Link } from 'lucide-angular';
import { GymService } from '../../../services/gym.service';
import { UpdateGymDto } from '../../../Models/gym.models';

@Component({
  selector: 'app-edit-gym-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './edit-gym-modal.component.html',
})
export class EditGymModalComponent implements OnInit {
  @Input({ required: true }) gymId!: string;

  readonly gymUpdated = output<void>();
  readonly cancelled  = output<void>();

  private readonly gymService = inject(GymService);

  readonly X         = X;
  readonly Building2 = Building2;
  readonly MapPin    = MapPin;
  readonly Phone     = Phone;
  readonly Link      = Link;

  readonly isLoading = signal(true);
  readonly isSaving  = signal(false);
  readonly error     = signal<string | null>(null);

  name        = '';
  address     = '';
  phoneNumber = '';
  logoUrl     = '';

  ngOnInit(): void {
    this.gymService.getById(this.gymId).subscribe({
      next: (gym) => {
        this.name        = gym.name;
        this.address     = gym.address;
        this.phoneNumber = gym.phoneNumber;
        this.logoUrl     = gym.logoUrl ?? '';
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load gym details.');
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

    if (!this.name.trim() || !this.address.trim() || !this.phoneNumber.trim()) {
      this.error.set('Name, address, and phone are required.');
      return;
    }

    const body: UpdateGymDto = {
      name:        this.name.trim(),
      address:     this.address.trim(),
      phoneNumber: this.phoneNumber.trim(),
      logoUrl:     this.logoUrl.trim() || undefined,
    };

    this.isSaving.set(true);

    this.gymService.update(this.gymId, body).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.gymUpdated.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.detail ?? 'Failed to update gym.');
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
