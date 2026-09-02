import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ServerWakeService } from '../http/server-wake.service';

/** Feeds API request timing to ServerWakeService so the cold-start banner can show. */
@Injectable()
export class ServerWakeInterceptor implements HttpInterceptor {

  private readonly wake = inject(ServerWakeService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!req.url.startsWith(environment.apiBaseUrl)) {
      return next.handle(req);
    }

    this.wake.requestStarted();

    return next.handle(req).pipe(
      finalize(() => this.wake.requestEnded()),
    );
  }
}
