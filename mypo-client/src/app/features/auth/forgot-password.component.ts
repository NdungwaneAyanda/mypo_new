import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-bg">
      <div class="auth-center">
        <div class="auth-logo">
          <div class="auth-logo-icon">📈</div>
          <span>MyPO</span>
        </div>
        <h1 class="auth-heading">Reset Password</h1>
        <p class="auth-sub">Enter your email and we'll send you a reset link</p>

        <div class="auth-card">
          @if (sent()) {
            <div style="text-align:center;padding:.5rem 0">
              <div style="font-size:2.5rem;margin-bottom:.875rem">✉️</div>
              <p style="color:#111827;font-weight:700;font-size:1rem;margin-bottom:.5rem">Check your inbox</p>
              <p style="color:#6b7280;font-size:.875rem;margin-bottom:1.25rem">A password reset link has been sent to <strong>{{ email }}</strong></p>
              <a routerLink="/auth" class="auth-btn" style="text-decoration:none;display:flex;align-items:center;justify-content:center">Back to Sign In</a>
            </div>
          } @else {
            @if (error()) { <div class="auth-error">{{ error() }}</div> }
            <form (ngSubmit)="submit()">
              <div class="field-group">
                <label class="field-label">Email</label>
                <div class="field-wrap">
                  <span class="field-icon">✉</span>
                  <input class="field-input" type="email" [(ngModel)]="email" name="email" required placeholder="you@company.com" />
                </div>
              </div>
              <button class="auth-btn" type="submit" [disabled]="loading()">
                @if (loading()) { <span class="mini-spinner"></span> } Send Reset Link →
              </button>
            </form>
            <p class="auth-switch"><a routerLink="/auth" class="switch-link">← Back to Sign In</a></p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-bg { min-height: 100vh; background: linear-gradient(135deg, #0d1b2e 0%, #0f2744 45%, #0a3535 100%); display: flex; align-items: center; justify-content: center; padding: 2rem 1.5rem; }
    .auth-center { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 420px; }
    .auth-logo { display: flex; flex-direction: column; align-items: center; gap: .375rem; margin-bottom: 1.5rem; }
    .auth-logo-icon { font-size: 2rem; }
    .auth-logo span { color: #fff; font-size: 1.125rem; font-weight: 800; }
    .auth-heading { color: #fff; font-size: 1.875rem; font-weight: 800; margin-bottom: .375rem; text-align: center; }
    .auth-sub { color: rgba(255,255,255,.55); font-size: .9375rem; margin-bottom: 1.75rem; text-align: center; }
    .auth-card { background: #fff; border-radius: 14px; padding: 1.75rem; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
    .auth-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 8px; padding: .625rem .875rem; font-size: .875rem; margin-bottom: 1.125rem; }
    .field-group { margin-bottom: 1rem; }
    .field-label { font-size: .875rem; font-weight: 600; color: #374151; display: block; margin-bottom: .375rem; }
    .field-wrap { position: relative; display: flex; align-items: center; }
    .field-icon { position: absolute; left: .875rem; font-size: .9rem; color: #9ca3af; pointer-events: none; }
    .field-input { width: 100%; padding: .65rem .875rem .65rem 2.375rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: .9375rem; color: #111827; outline: none; transition: border-color .2s, box-shadow .2s; }
    .field-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.12); }
    .field-input::placeholder { color: #9ca3af; }
    .auth-btn { width: 100%; padding: .75rem; background: #111827; color: #fff; border: none; border-radius: 8px; font-size: .9375rem; font-weight: 700; cursor: pointer; margin-top: .375rem; transition: background .2s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
    .auth-btn:hover:not(:disabled) { background: #1f2937; }
    .auth-btn:disabled { opacity: .6; cursor: not-allowed; }
    .auth-switch { text-align: center; margin-top: 1.125rem; font-size: .875rem; color: #6b7280; }
    .switch-link { color: #10b981; font-weight: 600; text-decoration: none; }
    .switch-link:hover { text-decoration: underline; }
    .mini-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ForgotPasswordComponent {
  email   = '';
  loading = signal(false);
  error   = signal('');
  sent    = signal(false);

  constructor(private auth: AuthService) {}

  submit() {
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: err => { this.error.set(err.error?.message || 'Failed to send reset email.'); this.loading.set(false); }
    });
  }
}
