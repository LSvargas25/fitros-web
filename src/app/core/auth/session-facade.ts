import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';
import { PERMISSIONS } from './route-permissions';

export type AppRole = 'OwnerApp' | 'Admin' | 'Coach' | 'Client';

@Injectable({ providedIn: 'root' })
export class SessionFacade {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private _cachedToken: string | null = null;
  private _cachedPayload: any | null = null;

  private getJwtPayload(): any | null {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return null;

    if (this._cachedToken === token && this._cachedPayload) {
      return this._cachedPayload;
    }

    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      this._cachedToken = token;
      this._cachedPayload = payload;

      return payload;
    } catch {
      return null;
    }
  }

  get role(): AppRole {
    const payload = this.getJwtPayload();

    const raw =
      payload?.['role'] ??
      payload?.['Role'] ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      null;

    switch (raw) {
      case 'OwnerApp':
      case 'Admin':
      case 'Coach':
      case 'Client':
        return raw;
      default:
        return 'Client';
    }
  }

  get userEmail(): string | null {
    const payload = this.getJwtPayload();
    return payload?.['email'] ?? payload?.['Email'] ?? null;
  }

  get userName(): string | null {
    const payload = this.getJwtPayload();
    return payload?.['name'] ?? payload?.['unique_name'] ?? null;
  }

  get userAvatarUrl(): string | null {
    const payload = this.getJwtPayload();
    return payload?.['avatarUrl'] ?? payload?.['picture'] ?? null;
  }

  logout(): void {
    this.tokenStorage.clear();
    this._cachedPayload = null;
    this._cachedToken = null;
    this.router.navigateByUrl('/login');
  }

  hasAnyRole(allowed: readonly AppRole[]): boolean {
    return allowed.includes(this.role);
  }

  canViewClients(): boolean {
    return this.hasAnyRole(PERMISSIONS.CLIENTS);
  }

  canViewOwnerAdmins(): boolean {
    return this.hasAnyRole(PERMISSIONS.OWNER_ADMINS);
  }

  canSeeSelfTraining(): boolean {
    return this.hasAnyRole(PERMISSIONS.TRAINING_SELF);
  }

  canSeeSelfNutrition(): boolean {
    return this.hasAnyRole(PERMISSIONS.NUTRITION_SELF);
  }

  canSeeSelfProgress(): boolean {
    return this.hasAnyRole(PERMISSIONS.PROGRESS_SELF);
  }

  canManageTraining(): boolean {
    return this.hasAnyRole(PERMISSIONS.TRAINING_MANAGE);
  }

  canManageNutrition(): boolean {
    return this.hasAnyRole(PERMISSIONS.NUTRITION_MANAGE);
  }

  canManageProgress(): boolean {
    return this.hasAnyRole(PERMISSIONS.PROGRESS_MANAGE);
  }
}
