import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Mail, ShieldCheck, Pencil, AlertTriangle, CheckCircle2 } from 'lucide-angular';

import { SessionFacade } from '../../../../core/auth/session-facade';
import { UserService, UserDetail } from '../../../OwnerAdmin/services/user.service';

const ROLE_LABEL: Record<number, string> = {
  0: 'Propietario',
  1: 'Administrador',
  2: 'Entrenador',
  3: 'Cliente',
};

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly session = inject(SessionFacade);
  private readonly userService = inject(UserService);

  readonly User = User;
  readonly Mail = Mail;
  readonly ShieldCheck = ShieldCheck;
  readonly Pencil = Pencil;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly user = signal<UserDetail | null>(null);

  // The backend's UpdateUserCommand is gated to OwnerApp/Admin/Coach by
  // AuthorizationBehavior, so a Client cannot edit even their own record.
  canEdit(): boolean {
    return this.session.role !== 'Client';
  }

  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  firstName = '';
  lastName = '';
  email = '';

  private userId: string | null = null;

  roleLabel(role: number): string {
    return ROLE_LABEL[role] ?? '—';
  }

  ngOnInit(): void {
    this.userId = this.session.userId;

    if (!this.userId) {
      this.isLoading.set(false);
      this.error.set('No se pudo identificar al usuario de la sesión. Vuelve a iniciar sesión.');
      return;
    }

    this.load();
  }

  private load(): void {
    if (!this.userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.resetForm(user);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.detail ?? 'No se pudo cargar tu perfil.');
        this.isLoading.set(false);
      },
    });
  }

  private resetForm(user: UserDetail): void {
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
  }

  startEdit(): void {
    const user = this.user();
    if (!user) return;
    this.resetForm(user);
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.saveError.set(null);
  }

  save(): void {
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const firstName = this.firstName.trim();
    const lastName = this.lastName.trim();
    const email = this.email.trim();

    if (!firstName || !lastName) {
      this.saveError.set('Nombre y apellido son obligatorios.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.saveError.set('Escribe un email válido.');
      return;
    }

    if (!this.userId) return;

    this.isSaving.set(true);

    this.userService.updateUser(this.userId, { firstName, lastName, email }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.saveSuccess.set(true);
        const current = this.user();
        if (current) {
          this.user.set({ ...current, firstName, lastName, email });
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err?.detail ?? 'No se pudieron guardar los cambios.');
      },
    });
  }
}
