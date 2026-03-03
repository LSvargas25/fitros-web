import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

import { routes } from './app.routes';

import {
  LucideAngularModule,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Settings,
  ChevronDown,
   Menu,
  Search,
  Bell,
  User,
  LogOut,
  Camera,
  Image,
  PanelLeftClose
} from 'lucide-angular';

import { AuthInterceptor } from './Core/Http/AuthInterceptor';
import { ErrorInterceptor } from './Core/Interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),


    importProvidersFrom(
      LucideAngularModule.pick({
        Mail,
        Lock,
        Eye,
        EyeOff,
        AlertTriangle,
        Loader2,
        ShieldCheck,
        Menu,
        Search,
        Bell,
        Settings,
        LogOut,
        ChevronDown,
         PanelLeftClose,
         Camera,
  Image,User
      })
    ),

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
};
