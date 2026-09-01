import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, UserPlus, Mail, User, Lock, Building2, AlertTriangle, ArrowLeft } from 'lucide-angular';

import { SessionFacade } from '../../../../../core/auth/session-facade';
import { UserService, CreateClientDto } from '../../../../OwnerAdmin/services/user.service';
import { GymService } from '../../../../OwnerAdmin/services/gym.service';
import { GymListItemResponse } from '../../../../OwnerAdmin/Models/gym.models';

@Component({
  selector: 'app-client-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './client-form.page.html',
  styleUrl: './client-form.page.css',
})
export class ClientFormPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly gymService = inject(GymService);
  private readonly session = inject(SessionFacade);
  private readonly router = inject(Router);

  readonly UserPlus = UserPlus;
  readonly Mail = Mail;
  readonly User = User;
  readonly Lock = Lock;
  readonly Building2 = Building2;
  readonly AlertTriangle = AlertTriangle;
  readonly ArrowLeft = ArrowLeft;

  // The backend only needs a gymId when an OwnerApp user creates the client;
  // Admin/Coach inherit their own gym.
  readonly needsGym = this.session.role === 'OwnerApp';

  readonly gyms = signal<GymListItemResponse[]>([]);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  email = '';
  firstName = '';
  lastName = '';
  password = '';
  gymId = '';

  ngOnInit(): void {
    if (this.needsGym) {
      this.gymService.getAll(undefined, true).subscribe({
        next: (gyms) => this.gyms.set(gyms),
        error: () => {},
      });
    }
  }

  submit(): void {
    this.error.set(null);

    const email = this.email.trim();
    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();

    if (!firstName || !lastName) {
      this.error.set('Nombre y apellido son obligatorios.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Escribe un email válido.');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.needsGym && !this.gymId) {
      this.error.set('Selecciona el gimnasio del cliente.');
      return;
    }

    const dto: CreateClientDto = { email, firstName, lastName, password: this.password };
    if (this.needsGym) {
      dto.gymId = this.gymId;
    }

    this.isSaving.set(true);

    this.userService.createClient(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.detail ?? 'No se pudo crear el cliente.');
      },
    });
  }
}
