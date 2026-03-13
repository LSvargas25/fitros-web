import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gymId?: string | null;
  gymName?: string | null;
  status: string;
}

export interface CoachUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gymId?: string | null;
  gymName?: string | null;
  status: string;
}

export interface CreateAdminDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface CreateClientDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  gymId?: string;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ClientListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  gymId?: string | null;
  gymName?: string | null;
  coachId?: string | null;
  coachName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http    = inject(HttpClient);
  private readonly base    = `${environment.apiBaseUrl}/api`;

  // ── Admins ─────────────────────────────────────────────────────────────────
  getAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/admins`);
  }

  getAdminById(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.base}/admins/${id}`);
  }

  createAdmin(dto: CreateAdminDto): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.base}/admins`, dto);
  }

  updateAdmin(id: string, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.base}/admins/${id}`, dto);
  }

  activateAdmin(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/admins/${id}/activate`, {});
  }

  deactivateAdmin(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/admins/${id}/deactivate`, {});
  }

  deleteAdmin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admins/${id}/permanent`);
  }

  // ── Coaches ────────────────────────────────────────────────────────────────
  getCoaches(): Observable<CoachUser[]> {
    return this.http.get<CoachUser[]>(`${this.base}/coaches`);
  }

  getCoachById(id: string): Observable<CoachUser> {
    return this.http.get<CoachUser>(`${this.base}/coaches/${id}`);
  }

  createCoach(dto: CreateUserDto): Observable<void> {
    return this.http.post<void>(`${this.base}/coaches`, dto);
  }

  updateCoach(id: string, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.base}/coaches/${id}`, dto);
  }

  activateCoach(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/coaches/${id}/activate`, {});
  }

  deactivateCoach(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/coaches/${id}/deactivate`, {});
  }

  deleteCoach(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/coaches/${id}`);
  }

  // ── Clients ────────────────────────────────────────────────────────────────
  getClients(): Observable<ClientListItem[]> {
    return this.http.get<ClientListItem[]>(`${this.base}/clients`);
  }

  getClient(id: string): Observable<ClientListItem> {
    return this.http.get<ClientListItem>(`${this.base}/clients/${id}`);
  }

  getClientById(id: string): Observable<ClientListItem> {
    return this.http.get<ClientListItem>(`${this.base}/clients/${id}`);
  }

  createClient(dto: CreateClientDto): Observable<void> {
    return this.http.post<void>(`${this.base}/clients`, dto);
  }

  updateClient(id: string, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.base}/clients/${id}`, dto);
  }

  activateClient(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/clients/${id}/activate`, {});
  }

  deactivateClient(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/clients/${id}/deactivate`, {});
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/clients/${id}`);
  }

  // ── Generic user operations ────────────────────────────────────────────────
  updateUser(id: string, dto: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.base}/users/${id}`, dto);
  }

  activateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  hardDeleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}/permanent`);
  }
}
