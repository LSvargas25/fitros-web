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

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/users`;

  createAdmin(dto: CreateAdminDto): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/admins`, dto);
  }

  getAdmins(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/admins`);
  }

  assignAdminToGym(adminId: string, gymId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/admins/${adminId}/gym`, { gymId });
  }

  createClient(dto: CreateUserDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/clients`, dto);
  }

  createCoach(dto: CreateUserDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/coaches`, dto);
  }
}
