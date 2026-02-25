import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

import { LucideAngularModule, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2, ShieldCheck } from 'lucide-angular';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    // icons - we can import the entire module, but this is more efficient
    importProvidersFrom(
      LucideAngularModule.pick({
        Mail,Lock,Eye, EyeOff, AlertTriangle,Loader2,ShieldCheck,
      })
    ), // Enables DI-based interceptors
    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }

  ],
};
