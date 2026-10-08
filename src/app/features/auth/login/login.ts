import { Component, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { SessionFacade } from '../../../core/auth/session-facade';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DemoAccount } from './demo-accounts';

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
  private readonly googleIdentity = inject(GoogleIdentityService);

  // UI state
  isSubmitting = false;
  isGoogleSubmitting = false;
  errorMessage: string | null = null;
  showPassword = false;

  readonly demoAccounts = DEMO_ACCOUNTS;
  /** Key of the demo account currently signing in, if any. */
  demoInFlight: DemoAccount['key'] | null = null;

  /** Any sign-in in progress: every sign-in button is disabled meanwhile. */
  get busy(): boolean {
    return this.isSubmitting || this.isGoogleSubmitting || this.demoInFlight !== null;
  }

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

  /**
   * One-click sign-in with a public demo account. Not remembered: the demo
   * session lives in sessionStorage and ends with the tab.
   */
  loginAsDemo(account: DemoAccount): void {
    if (this.busy) {
      return;
    }

    this.errorMessage = null;
    this.demoInFlight = account.key;
    this.cdr.detectChanges();

    this.auth.login({ email: account.email, password: DEMO_PASSWORD }, false)
      .subscribe({
        next: () => {
          this.demoInFlight = null;
          this.cdr.detectChanges();
          this.router.navigateByUrl(this.session.landingUrl);
        },
        error: (err) => {
          this.demoInFlight = null;
          this.errorMessage =
            err?.detail ||
            'No se pudo entrar a la demo. Inténtalo de nuevo en unos segundos.';
          this.cdr.detectChanges();
        },
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

  async loginWithGoogle(): Promise<void> {

    if (this.isGoogleSubmitting) {
      return;
    }

    this.errorMessage = null;
    this.isGoogleSubmitting = true;
    this.cdr.detectChanges();

    let idToken: string;
    try {
      idToken = await this.googleIdentity.requestIdToken();
    } catch (err: any) {
      this.isGoogleSubmitting = false;
      this.errorMessage = err?.message || 'Google sign-in failed. Please try again.';
      this.cdr.detectChanges();
      return;
    }

    const rememberMe = this.form.controls.rememberMe.value;

    this.auth.loginWithGoogle(idToken, rememberMe).subscribe({
      next: () => {
        this.isGoogleSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigateByUrl(this.session.landingUrl);
      },
      error: (err) => {
        this.isGoogleSubmitting = false;
        this.errorMessage = err?.detail || 'Google sign-in failed. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }
}
