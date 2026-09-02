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
  PanelLeftClose,
  Plus,
  Scale,
  Percent,
  Dumbbell,
  Ruler,
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  ChartLine,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-angular';

import { AuthInterceptor } from './core/http/AuthInterceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { ServerWakeInterceptor } from './core/interceptors/server-wake.interceptor';

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
  Image,User,
  Plus,
  Scale,
  Percent,
  Dumbbell,
  Ruler,
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  ChartLine,
  Zap,
  CheckCircle2,
  XCircle
      })
    ),

    { provide: HTTP_INTERCEPTORS, useClass: ServerWakeInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
};
