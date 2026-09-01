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

  /** The role claim resolved to a known `AppRole`, or `null` if the token has
   *  no recognisable role. Kept private so callers get the safe getter below. */
  private resolveRole(payload: any | null): AppRole | null {
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
        return null;
    }
  }

  get role(): AppRole {
    return this.resolveRole(this.getJwtPayload()) ?? 'Client';
  }

  /** Where a user should land after login / when hitting `''`. */
  get landingUrl(): string {
    return this.role === 'Client' ? '/my/training' : '/dashboard';
  }

  /** JWT `exp` (seconds) as epoch milliseconds, or `null` if absent. */
  private get tokenExpiryMs(): number | null {
    const exp = this.getJwtPayload()?.['exp'];
    return typeof exp === 'number' ? exp * 1000 : null;
  }

  isTokenExpired(): boolean {
    const expMs = this.tokenExpiryMs;
    return expMs != null && Date.now() >= expMs;
  }

  /**
   * True when there is a usable session. If a token is present but unusable —
   * unparseable, missing a known role claim, or expired — the stored tokens are
   * dropped (forced logout) and this returns false. Used by `authGuard`.
   */
  validateSession(): boolean {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return false;

    const payload = this.getJwtPayload();
    const usable =
      payload != null &&
      this.resolveRole(payload) != null &&
      !this.isTokenExpired();

    if (!usable) {
      this.tokenStorage.clear();
      this._cachedPayload = null;
      this._cachedToken = null;
      return false;
    }

    return true;
  }

  /** The authenticated user's id, taken from the JWT `sub` claim (see
   *  FitRos.Infrastructure/Security/TokenService). */
  get userId(): string | null {
    const payload = this.getJwtPayload();
    return (
      payload?.['sub'] ??
      payload?.['nameid'] ??
      payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
      null
    );
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
