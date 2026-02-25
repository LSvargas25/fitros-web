import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  templateUrl: './login.html',
})
export class Login {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // UI state
  isSubmitting = false;
  errorMessage: string | null = null;
  showPassword = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  readonly emailCtrl = computed(() => this.form.controls.email);
  readonly passwordCtrl = computed(() => this.form.controls.password);

  get emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  get passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

submit(): void {

  this.errorMessage = null;
  this.isSubmitting = true;

  const { email, password } = this.form.getRawValue();

  this.auth.login({ email, password })
    .subscribe({
      next: () => {
        console.log('NEXT');
        this.isSubmitting = false;
      },
      error: (err) => {
        console.log('ERROR:', err);
        this.errorMessage = err?.detail || 'Error';
        this.isSubmitting = false;
      },
      complete: () => {
        console.log('COMPLETE');
        this.isSubmitting = false;
      }
    });
}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  loginWithGoogle(): void {
    console.log('Google login not implemented yet');
  }
}
