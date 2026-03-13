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

        let apiError: ApiError = { status: error.status };

        if (error.error) {
          const body = typeof error.error === 'string'
            ? (() => { try { return JSON.parse(error.error); } catch { return null; } })()
            : error.error;

          if (body) {
            apiError = { ...body, status: body.status ?? error.status };

            // ValidationException: concatenate field errors into detail
            if (body.errors && typeof body.errors === 'object') {
              const messages = Object.values(body.errors as Record<string, string[]>)
                .flat()
                .join(' ');
              apiError.detail = messages || body.detail;
            }
          } else if (typeof error.error === 'string') {
            apiError.detail = error.error;
          }
        }

        return throwError(() => apiError);
      })
    );
  }
}
