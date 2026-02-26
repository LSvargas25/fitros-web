import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../Http/api-error.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        let apiError: ApiError = {
          status: error.status
        };

        if (error.error) {
          if (typeof error.error === 'string') {
            try {
              apiError = JSON.parse(error.error);
            } catch {
              apiError.detail = error.error;
            }
          } else {
            apiError = error.error as ApiError;
          }
        }

        return throwError(() => apiError);
      })
    );
  }
}
