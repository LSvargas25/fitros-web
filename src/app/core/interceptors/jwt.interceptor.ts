import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../auth/token-storage.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const accessToken = tokenStorage.getAccessToken();

  // Avoid adding token to auth endpoints (optional safety)
  if (!accessToken || req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` }
  });

  return next(authReq);
};
