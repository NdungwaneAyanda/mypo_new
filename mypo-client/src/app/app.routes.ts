import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/static/home.component').then(m => m.HomeComponent) },
  { path: 'auth', loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'apply', loadComponent: () => import('./features/apply/apply.component').then(m => m.ApplyComponent), canActivate: [authGuard] },
  { path: 'register-funder', loadComponent: () => import('./features/funder/register-funder.component').then(m => m.RegisterFunderComponent) },
  { path: 'profile', loadComponent: () => import('./features/static/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'unsubscribe', loadComponent: () => import('./features/static/unsubscribe.component').then(m => m.UnsubscribeComponent) },
  { path: 'about', loadComponent: () => import('./features/static/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./features/static/contact.component').then(m => m.ContactComponent) },
  { path: 'privacy', loadComponent: () => import('./features/static/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'terms', loadComponent: () => import('./features/static/terms.component').then(m => m.TermsComponent) },
  { path: 'admin', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard, adminGuard] },
  { path: '**', loadComponent: () => import('./features/static/not-found.component').then(m => m.NotFoundComponent) }
];
