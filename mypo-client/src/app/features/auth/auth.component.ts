import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoComponent } from '../../shared/components/logo.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  template: `
    <div class="auth-bg" [class.bg-register]="mode() === 'register'">
      <div class="auth-center">

        <!-- Logo -->
        <app-logo [size]="44" [stacked]="true" [light]="true" style="margin-bottom:1.5rem"></app-logo>

        <!-- Heading -->
        <h1 class="auth-heading">{{ mode() === 'login' ? 'Welcome Back' : 'Create Account' }}</h1>
        <p class="auth-sub">{{ mode() === 'login' ? 'Sign in to manage your PO funding' : 'Join MyPO to get started' }}</p>

        <!-- Card -->
        <div class="auth-card" [class.card-register]="mode() === 'register'" [class.card-funder]="mode() === 'login' && loginRole() === 'funder'">

          @if (mode() === 'login') {
            <!-- Role toggle -->
            <div class="role-toggle-wrap">
              <p class="role-label">Sign in as</p>
              <div class="role-toggle">
                <button type="button" class="role-btn" [class.active-supplier]="loginRole() === 'supplier'" (click)="loginRole.set('supplier')">
                  <i class="fa-solid fa-industry"></i> Supplier
                </button>
                <button type="button" class="role-btn" [class.active-funder]="loginRole() === 'funder'" (click)="loginRole.set('funder')">
                  <i class="fa-solid fa-briefcase"></i> Funder
                </button>
              </div>
            </div>
          } @else {
            <!-- Register label -->
            <div class="mode-badge badge-register"><i class="fa-solid fa-user-plus"></i> Supplier Account</div>
            <p class="register-note">This creates a <strong>Supplier</strong> account. Are you a funder? <a routerLink="/register-funder" class="forgot-link">Register as a Funder</a></p>
          }

          @if (error()) {
            <div class="auth-error">{{ error() }}</div>
          }

          <form (ngSubmit)="mode() === 'login' ? login() : register()">
            <div class="field-group">
              <label class="field-label">Email</label>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa-solid fa-envelope"></i></span>
                <input class="field-input" [class.input-register]="mode() === 'register'"
                       type="email" [(ngModel)]="email" name="email"
                       required placeholder="you@company.com" autocomplete="off" />
              </div>
            </div>

            <div class="field-group">
              <div class="field-label-row">
                <label class="field-label">Password</label>
                @if (mode() === 'login') {
                  <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
                }
              </div>
              <div class="field-wrap">
                <span class="field-icon"><i class="fa-solid fa-lock"></i></span>
                <input class="field-input" [class.input-register]="mode() === 'register'"
                       [type]="showPw() ? 'text' : 'password'"
                       [(ngModel)]="password" name="password" required placeholder="••••••••"
                       autocomplete="new-password" />
                <button type="button" class="eye-btn" (click)="showPw.set(!showPw())">
                  <i [class]="showPw() ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                </button>
              </div>
              @if (mode() === 'register') {
                <p class="pw-hint">Minimum 8 characters</p>
              }
            </div>

            <button class="auth-btn"
              [class.btn-register]="mode() === 'register'"
              [class.btn-funder]="mode() === 'login' && loginRole() === 'funder'"
              type="submit" [disabled]="loading()">
              @if (loading()) { <span class="mini-spinner"></span> }
              @if (mode() === 'login') {
                Sign In as {{ loginRole() === 'funder' ? 'Funder' : 'Supplier' }} →
              } @else {
                Create Supplier Account →
              }
            </button>
          </form>

          <p class="auth-switch">
            @if (mode() === 'login') {
              Don't have an account? <button class="switch-link" (click)="switchMode('register')">Sign up</button>
            } @else {
              Already have an account? <button class="switch-link switch-link-login" (click)="switchMode('login')">Sign in</button>
            }
          </p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Backgrounds ── */
    .auth-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #0d1b2e 0%, #0f2744 55%, #0a3535 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem 1.5rem;
      transition: background 0.4s ease;
    }
    /* Register — warm teal/emerald shift */
    .auth-bg.bg-register {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #0f3460 100%);
    }

    .auth-center {
      display: flex; flex-direction: column; align-items: center;
      width: 100%; max-width: 440px;
    }

    /* Headings */
    .auth-heading {
      color: #fff; font-size: 1.875rem; font-weight: 800;
      margin-bottom: .375rem; text-align: center;
    }
    .auth-sub {
      color: rgba(255,255,255,.55); font-size: .9375rem;
      margin-bottom: 1.75rem; text-align: center;
    }

    /* ── Card ── */
    .auth-card {
      background: #fff; border-radius: 14px;
      padding: 0 1.75rem 1.5rem;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
      /* Login — navy top accent */
      border-top: 4px solid #1e3a5f;
    }
    /* Register — teal top accent */
    .auth-card.card-register {
      border-top-color: #10b981;
    }

    /* ── Funder card variant ── */
    .auth-card.card-funder { border-top-color: #7c3aed; }

    /* ── Role toggle (login) ── */
    .role-toggle-wrap { padding: 1.25rem 0 1rem; text-align: center; }
    .role-label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9ca3af; margin-bottom: .6rem; }
    .role-toggle {
      display: inline-flex; border: 1.5px solid #e5e7eb;
      border-radius: 10px; overflow: hidden; width: 100%;
    }
    .role-btn {
      flex: 1; padding: .6rem 1rem; border: none; background: #f9fafb;
      font-size: .9rem; font-weight: 600; color: #6b7280;
      cursor: pointer; transition: all .2s; letter-spacing: .01em;
    }
    .role-btn:first-child { border-right: 1.5px solid #e5e7eb; }
    .role-btn.active-supplier { background: #1e3a5f; color: #fff; }
    .role-btn.active-funder   { background: #7c3aed; color: #fff; }

    /* ── Mode badge (register) ── */
    .mode-badge {
      display: block; margin: 1.25rem 0 .5rem;
      padding: .3rem .9rem; border-radius: 9999px;
      font-size: .8rem; font-weight: 700; letter-spacing: .04em;
      text-align: center; background: #ecfdf5; color: #065f46;
    }
    .register-note {
      font-size: .8125rem; color: #6b7280; text-align: center;
      margin-bottom: 1rem; line-height: 1.5;
    }

    .auth-error {
      background: #fef2f2; color: #b91c1c;
      border: 1px solid #fecaca; border-radius: 8px;
      padding: .625rem .875rem; font-size: .875rem;
      margin-bottom: 1.125rem;
    }

    /* Fields */
    .field-group { margin-bottom: 1rem; }
    .field-label { font-size: .875rem; font-weight: 600; color: #374151; display: block; margin-bottom: .375rem; }
    .field-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: .375rem; }
    .forgot-link { font-size: .8125rem; color: #10b981; text-decoration: none; font-weight: 500; }
    .forgot-link:hover { text-decoration: underline; }

    .field-wrap { position: relative; display: flex; align-items: center; }
    .field-icon {
      position: absolute; left: .875rem; font-size: .85rem;
      color: #9ca3af; pointer-events: none; z-index: 1;
      display: flex; align-items: center;
    }
    .field-input {
      width: 100%; padding: .65rem .875rem .65rem 2.375rem;
      border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: .9375rem; color: #111827; background: #fff;
      outline: none; transition: border-color .2s, box-shadow .2s;
    }
    /* Login focus — navy ring */
    .field-input:focus { border-color: #1e3a5f; box-shadow: 0 0 0 3px rgba(30,58,95,.12); }
    /* Register focus — teal ring */
    .field-input.input-register:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.14); }
    .field-input::placeholder { color: #9ca3af; }

    .pw-hint { font-size: .78rem; color: #9ca3af; margin-top: .3rem; }

    .eye-btn {
      position: absolute; right: .75rem;
      background: none; border: none; cursor: pointer;
      font-size: .85rem; color: #9ca3af; padding: 0; line-height: 1;
    }
    .eye-btn:hover { color: #6b7280; }

    /* ── Submit buttons ── */
    .auth-btn {
      width: 100%; padding: .75rem;
      background: #1e3a5f; color: #fff;
      border: none; border-radius: 8px;
      font-size: .9375rem; font-weight: 700;
      cursor: pointer; margin-top: .375rem;
      transition: background .2s;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
    }
    .auth-btn:hover:not(:disabled) { background: #162d4a; }
    /* Register — teal button */
    .auth-btn.btn-register { background: #059669; }
    .auth-btn.btn-register:hover:not(:disabled) { background: #047857; }
    /* Funder — purple button */
    .auth-btn.btn-funder { background: #7c3aed; }
    .auth-btn.btn-funder:hover:not(:disabled) { background: #6d28d9; }
    .auth-btn:disabled { opacity: .6; cursor: not-allowed; }

    /* Switch link */
    .auth-switch {
      text-align: center; margin-top: 1.125rem;
      font-size: .875rem; color: #6b7280;
    }
    .switch-link {
      background: none; border: none; cursor: pointer;
      color: #10b981; font-weight: 600; font-size: .875rem;
      padding: 0;
    }
    /* Sign in link on register card — navy colour */
    .switch-link.switch-link-login { color: #1e3a5f; }
    .switch-link:hover { text-decoration: underline; }

    /* Spinner */
    .mini-spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
      border-radius: 50%; animation: spin .65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthComponent {
  mode      = signal<'login' | 'register'>('login');
  loginRole = signal<'supplier' | 'funder'>('supplier');
  email     = '';
  password  = '';
  loading   = signal(false);
  error     = signal('');
  showPw    = signal(false);

  constructor(private auth: AuthService, private router: Router, private toast: ToastService) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  switchMode(m: 'login' | 'register') {
    this.mode.set(m); this.error.set(''); this.email = ''; this.password = '';
  }

  login() {
    const email = this.email.trim().toLowerCase();
    if (!email) { this.error.set('Please enter your email address.'); return; }
    this.error.set(''); this.loading.set(true);
    this.auth.login({ email, password: this.password }).subscribe({
      next: res => {
        const user = this.auth.currentUser();
        // Admin bypasses the role toggle — go straight to admin panel
        if (user?.roles.includes('admin')) {
          this.loading.set(false);
          this.auth.setActiveRole('admin');
          this.toast.success('Welcome back, Admin!');
          this.router.navigate(['/admin']);
          return;
        }
        const expectedRole = this.loginRole();
        if (user && !user.roles.includes(expectedRole)) {
          const actual = user.roles.includes('funder') ? 'Funder' : 'Supplier';
          this.error.set(`This account is registered as a ${actual}. Please select the correct role above.`);
          this.auth.logout();
          this.loading.set(false);
          return;
        }
        this.auth.setActiveRole(expectedRole);
        this.toast.success(`Welcome back, ${expectedRole === 'funder' ? 'Funder' : 'Supplier'}!`);
        this.router.navigate(['/dashboard']);
      },
      error: err => { this.error.set(err.error?.message || 'Invalid email or password.'); this.loading.set(false); }
    });
  }

  register() {
    const email = this.email.trim().toLowerCase();
    if (!email) { this.error.set('Please enter your email address.'); return; }
    this.error.set('');
    if (this.password.length < 8) { this.error.set('Password must be at least 8 characters.'); return; }
    this.loading.set(true);
    this.auth.register({ email, password: this.password }).subscribe({
      next: () => { this.auth.setActiveRole('supplier'); this.toast.success(`Account created for ${email}. Welcome to MyPO!`); this.router.navigate(['/dashboard']); },
      error: err => { this.error.set(err.error?.message || 'Registration failed. Please try again.'); this.loading.set(false); }
    });
  }
}
