import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'fitros.access_token';
const REFRESH_TOKEN_KEY = 'fitros.refresh_token';
const STORAGE_MODE_KEY = 'fitros.storage_mode'; // 'local' | 'session'

type StorageMode = 'local' | 'session';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {

  // =============================
  // GET STORAGE
  // =============================

  private get storage(): Storage {
    const mode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode;

    if (mode === 'session') {
      return sessionStorage;
    }

    return localStorage;
  }

  // =============================
  // GET TOKENS
  // =============================

  getAccessToken(): string | null {
    return this.storage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  // =============================
  // SET TOKENS
  // =============================

  setTokens(accessToken: string, refreshToken: string, rememberMe = true): void {

    const targetStorage = rememberMe ? localStorage : sessionStorage;

    // Clear both first to avoid duplicates
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);

    targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    localStorage.setItem(STORAGE_MODE_KEY, rememberMe ? 'local' : 'session');
  }

  // =============================
  // CLEAR
  // =============================

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(STORAGE_MODE_KEY);
  }
}
