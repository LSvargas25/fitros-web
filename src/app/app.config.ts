import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

import { LucideAngularModule, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2, ShieldCheck } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),

    // ⭐ ESTA ES LA FORMA CORRECTA PARA TU VERSION
    importProvidersFrom(
      LucideAngularModule.pick({
        Mail,
        Lock,
        Eye,
        EyeOff,
        AlertTriangle,
        Loader2,
        ShieldCheck,
      })
    ),
  ],
};
