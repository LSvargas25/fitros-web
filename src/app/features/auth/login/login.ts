import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { TokenStorageService } from '../../../core/auth/token-storage.service';

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
  private readonly tokenStorage = inject(TokenStorageService);
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

  // Helpful getters for template
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
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;

    const { email, password, rememberMe } = this.form.getRawValue();

    this.auth
      .login({ email, password })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (res) => {
          // If you support rememberMe, you can decide storage strategy here.
          // For now we store as usual (you can adapt TokenStorageService if needed).
          this.tokenStorage.setTokens(res.accessToken, res.refreshToken);

          // Optional: you can store rememberMe preference
          // localStorage.setItem('fitros.rememberMe', String(rememberMe));

          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail ||
            err?.error?.message ||
            'Invalid email or password';
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  loginWithGoogle(): void {
    // Later:
    // - Redirect to backend OAuth endpoint
    // - or use Google Identity Services
    console.log('Google login not implemented yet');
  }
}
