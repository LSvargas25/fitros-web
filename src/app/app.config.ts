import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

import { routes } from './app.routes';

import { LucideAngularModule, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2, ShieldCheck } from 'lucide-angular';

import { AuthInterceptor } from './core/http/AuthInterceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),


    provideHttpClient(withInterceptorsFromDi()),

    // icons
    importProvidersFrom(
      LucideAngularModule.pick({
        Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2, ShieldCheck,
      })
    ),


    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
};
