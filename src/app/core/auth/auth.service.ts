import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  GoogleLoginResponse
} from '../../shared/models/auth.models';
import { TokenStorageService } from './token-storage.service';

export type ResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly baseUrl = environment.apiBaseUrl;
  private readonly authBase = `${this.baseUrl}/api/Auth`;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router
  ) {}

  // =============================
  // LOGIN
  // =============================

  login(request: LoginRequest, rememberMe: boolean): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.authBase}/login`, request)
      .pipe(
        tap(res =>
          this.tokenStorage.setTokens(
            res.accessToken,
            res.refreshToken,
            rememberMe
          )
        )
      );
  }

  // =============================
  // REFRESH TOKEN
  // =============================

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    const payload: RefreshRequest = { refreshToken };

    return this.http
      .post<RefreshResponse>(`${this.authBase}/refresh`, payload)
      .pipe(
        tap(res => {
          // keeps current storage mode (local vs session) internally
          // TokenStorageService chooses storage based on saved mode
          this.tokenStorage.setTokens(res.accessToken, res.refreshToken);
        })
      );
  }

  // =============================
  // REGISTER
  // =============================

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.authBase}/register`,
      request
    );
  }

  // =============================
  // VERIFY EMAIL
  // =============================

  verifyEmail(request: VerifyEmailRequest): Observable<void> {
    return this.http.post<void>(
      `${this.authBase}/verify-email`,
      request
    );
  }

  // Backend always answers 200 here (no email enumeration); throttling is
  // enforced by the controller-level rate limiter, which replies 429.
  resendVerification(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.authBase}/resend-verification`,
      { email }
    );
  }

  // =============================
  // GOOGLE
  // =============================

  loginWithGoogle(idToken: string, rememberMe = true): Observable<GoogleLoginResponse> {
    return this.http
      .post<GoogleLoginResponse>(`${this.authBase}/google`, { idToken })
      .pipe(
        tap(res =>
          this.tokenStorage.setTokens(
            res.accessToken,
            res.refreshToken,
            rememberMe
          )
        )
      );
  }

  // =============================
  // FORGOT PASSWORD
  // =============================

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.authBase}/forgot-password`,
      { email }
    );
  }

  // =============================
  // RESET PASSWORD
  // =============================

  resetPassword(payload: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(
      `${this.authBase}/reset-password`,
      payload
    );
  }

  // =============================
  // LOGOUT
  // =============================

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigateByUrl('/login');
  }

  // =============================
  // AUTH CHECK
  // =============================

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getAccessToken();
  }
}
