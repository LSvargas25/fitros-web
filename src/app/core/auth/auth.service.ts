import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse
} from '../../shared/models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService
  ) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, request)
      .pipe(
        tap(res => this.tokenStorage.setTokens(res.accessToken, res.refreshToken))
      );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    const payload: RefreshRequest = { refreshToken };

    return this.http
      .post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, payload)
      .pipe(
        tap(res => this.tokenStorage.setTokens(res.accessToken, res.refreshToken))
      );
  }

  logout(): void {
    this.tokenStorage.clear();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getAccessToken();
  }
  forgotPassword(email: string) {
  return this.http.post<void>(
    `${this.baseUrl}/api/auth/forgot-password`,
    { email }
  );
}
}
