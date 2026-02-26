import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

export type AppRole = 'Admin' | 'Coach' | 'Client';

@Injectable({ providedIn: 'root' })
export class SessionFacade {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  get role(): AppRole {
    const token = this.tokenStorage.getAccessToken();
    const role = this.tryReadRoleFromJwt(token);

    if (role === 'Admin' || role === 'Coach' || role === 'Client') {
      return role;
    }

    return 'Client';
  }

  logout(): void {
    this.tokenStorage.clear();
    this.router.navigateByUrl('/login');
  }

  private tryReadRoleFromJwt(token: string | null | undefined): string | null {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      const raw =
        payload['role'] ??
        payload['Role'] ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        null;

      if (typeof raw === 'string') return raw;
      if (Array.isArray(raw) && raw.length > 0) return String(raw[0]);

      return null;
    } catch {
      return null;
    }
  }
}
