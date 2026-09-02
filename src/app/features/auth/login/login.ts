import { Component, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { SessionFacade } from '../../../core/auth/session-facade';

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
  private readonly session = inject(SessionFacade);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

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

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;
    this.cdr.detectChanges();

  const { email, password, rememberMe } = this.form.getRawValue();



    this.auth.login({ email, password }, rememberMe)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          this.router.navigateByUrl(this.session.landingUrl);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage =
            err?.detail ||
            'Invalid email or password';

          this.cdr.detectChanges();
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  loginWithGoogle(): void {
    console.log('Google login not implemented yet');
  }
}
