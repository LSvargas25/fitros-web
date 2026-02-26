import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../Core/Auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  email = '';
  token = '';

  isSubmitting = false;
  success = false;
  errorMessage: string | null = null;

  form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get('email') ?? '';
      this.token = params.get('token') ?? '';
    });
  }

  get linkInvalid(): boolean {
    return !this.email || !this.token;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

 submit(): void {
  if (this.linkInvalid || this.isSubmitting) return;

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const { newPassword } = this.form.getRawValue() as { newPassword: string };

  this.errorMessage = null;
  this.isSubmitting = true;

  this.auth
    .resetPassword({
      email: this.email,
      token: this.token,
      newPassword,
    })
    .pipe(finalize(() => (this.isSubmitting = false)))
    .subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.detail ||
          'Reset failed. Please request a new reset email.';
      },
    });
}
  goToForgot(): void {
    this.router.navigate(['/forgot-password']);
  }
}
