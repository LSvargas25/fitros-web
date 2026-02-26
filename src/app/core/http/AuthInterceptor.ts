import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { TokenStorageService } from '../Auth/token-storage.service';
import { AuthService } from '../Auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private readonly tokenStorage = inject(TokenStorageService);
  private readonly auth = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const isPublicAuthEndpoint =
      req.url.includes('/api/Auth/login') ||
      req.url.includes('/api/Auth/refresh') ||
      req.url.includes('/api/Auth/forgot-password') ||
      req.url.includes('/api/Auth/reset-password');

    const accessToken = this.tokenStorage.getAccessToken();

    const authReq = (!isPublicAuthEndpoint && accessToken)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: any) => {

        const status = err?.status;

        // only handle unauthorized for protected endpoints
        if (status !== 401 || isPublicAuthEndpoint) {
          return throwError(() => err);
        }

        // Retry once after refresh
        return this.auth.refresh().pipe(
          switchMap(() => {
            const newToken = this.tokenStorage.getAccessToken();

            if (!newToken) {
              this.auth.logout(); // ✅ centralized
              return throwError(() => err);
            }

            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });

            return next.handle(retryReq);
          }),
          catchError((refreshErr) => {
            this.auth.logout(); // ✅ centralized
            return throwError(() => refreshErr);
          })
        );
      })
    );
  }
}
