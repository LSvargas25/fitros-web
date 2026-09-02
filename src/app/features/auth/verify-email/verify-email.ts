import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

import { LucideAngularModule } from 'lucide-angular';

/** Seconds the resend button stays locked after a successful send. The backend
 *  rate limiter allows 5 requests per 5 minutes and returns 429 past that; this
 *  client-side cooldown keeps users well under that ceiling. */
const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';

  isSubmitting = false;
  isResending = false;
  success = false;
  errorMessage: string | null = null;
  resendMessage: string | null = null;
  resendCooldown = 0;

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get('email') ?? '';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.clearCooldown();
  }

  get linkInvalid(): boolean {
    return !this.email;
  }

  get codeInvalid(): boolean {
    const c = this.form.controls.code;
    return c.touched && c.invalid;
  }

  submit(): void {

    if (this.linkInvalid || this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;
    this.cdr.detectChanges();

    const { code } = this.form.getRawValue();

    this.auth
      .verifyEmail({ email: this.email, code })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/login']), 1200);
        },
        error: (err) => {
          this.errorMessage =
            err?.detail ||
            err?.error?.detail ||
            'Invalid or expired verification code.';
          this.cdr.detectChanges();
        },
      });
  }

  resend(): void {

    if (this.linkInvalid || this.isResending || this.resendCooldown > 0) {
      return;
    }

    this.errorMessage = null;
    this.resendMessage = null;
    this.isResending = true;
    this.cdr.detectChanges();

    this.auth
      .resendVerification(this.email)
      .pipe(
        finalize(() => {
          this.isResending = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.resendMessage = 'A new code is on its way. Check your inbox.';
          this.startCooldown();
        },
        error: (err) => {
          this.errorMessage =
            err?.status === 429
              ? 'Too many requests. Please wait a few minutes before trying again.'
              : err?.detail ||
                err?.error?.detail ||
                'Could not resend the code. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  private startCooldown(): void {
    this.clearCooldown();
    this.resendCooldown = RESEND_COOLDOWN_SECONDS;
    this.cdr.detectChanges();

    this.cooldownTimer = setInterval(() => {
      this.resendCooldown -= 1;
      if (this.resendCooldown <= 0) {
        this.clearCooldown();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private clearCooldown(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
