import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './register.html',
})
export class Register {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // UI state
  isSubmitting = false;
  errorMessage: string | null = null;
  showPassword = false;

  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: Register.passwordsMatch },
  );

  // Backend enforces the same 8-char minimum; the match check is client-side only.
  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  get firstNameInvalid(): boolean {
    const c = this.form.controls.firstName;
    return c.touched && c.invalid;
  }

  get lastNameInvalid(): boolean {
    const c = this.form.controls.lastName;
    return c.touched && c.invalid;
  }

  get emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  get passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

  get confirmInvalid(): boolean {
    const c = this.form.controls.confirmPassword;
    return c.touched && (c.invalid || !!this.form.errors?.['passwordMismatch']);
  }

  submit(): void {

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;
    this.cdr.detectChanges();

    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.auth
      .register({ firstName, lastName, email, password })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          // No tokens are issued at registration: the account is unverified
          // until the emailed code is confirmed, so route to that step.
          this.router.navigate(['/verify-email'], { queryParams: { email } });
        },
        error: (err) => {
          this.errorMessage =
            err?.detail ||
            err?.error?.detail ||
            'Could not create your account. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
