import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ApiError } from '../http/api-error.model';

/** Max time we wait for any single HTTP response before giving up. */
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req).pipe(
      timeout({ each: REQUEST_TIMEOUT_MS }),
      catchError((error: HttpErrorResponse | TimeoutError) => {

        // Backend accepted the connection but never answered: turn the hang into
        // a normal error so the page can drop its spinner and show a message.
        if (error instanceof TimeoutError) {
          const timeoutError: ApiError = {
            status: 0,
            detail: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
          };
          return throwError(() => timeoutError);
        }

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

        // Never surface server-side failure text (stack traces, SQL, internal
        // paths, exception type names) to the UI. 4xx bodies carry actionable
        // validation messages and are kept as-is; for 5xx we drop the body and
        // return a generic message.
        if (error.status >= 500) {
          return throwError(() => ({
            status: error.status,
            detail: 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
          } as ApiError));
        }

        return throwError(() => apiError);
      })
    );
  }
}
