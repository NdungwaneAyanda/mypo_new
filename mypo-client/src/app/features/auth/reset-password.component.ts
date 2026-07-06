import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <a routerLink="/" class="auth-logo">
          <span>📈</span><span class="logo-my">My</span><span class="logo-po">PO</span>
        </a>
        <h1>Set New Password</h1>
        <p class="auth-sub">Enter and confirm your new password below.</p>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input class="form-control" type="password" [(ngModel)]="password" name="pw" required placeholder="Min. 8 characters" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input class="form-control" type="password" [(ngModel)]="confirm" name="cf" required placeholder="Repeat password" />
          </div>
          <button class="btn btn-primary btn-full" type="submit" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> } Reset Password
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: calc(100vh - 60px); display: flex; align-items: center; justify-content: center; background: var(--gray-50); padding: 2rem 1.5rem; }
    .auth-box { background: #fff; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); padding: 2.5rem 2rem; width: 100%; max-width: 420px; }
    .auth-logo { display: flex; align-items: center; gap: .35rem; text-decoration: none; font-size: 1.35rem; font-weight: 800; margin-bottom: 1.5rem; }
    .auth-logo span:first-child { font-size: 1.2rem; }
    .logo-my { color: var(--navy); } .logo-po { color: var(--teal); }
    h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); margin-bottom: .3rem; }
    .auth-sub { color: var(--gray-500); font-size: .9375rem; margin-bottom: 1.5rem; }
  `]
})
export class ResetPasswordComponent {
  password = '';
  confirm  = '';
  loading  = signal(false);
  error    = signal('');
  token    = '';

  constructor(private auth: AuthService, private route: ActivatedRoute, private router: Router, private toast: ToastService) {
    this.route.queryParams.subscribe(p => this.token = p['token'] || '');
  }

  submit() {
    this.error.set('');
    if (this.password !== this.confirm) { this.error.set('Passwords do not match.'); return; }
    if (this.password.length < 8) { this.error.set('Password must be at least 8 characters.'); return; }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => { this.toast.success('Password reset! Please sign in.'); this.router.navigate(['/auth']); },
      error: err => { this.error.set(err.error?.message || 'Reset failed. The link may have expired.'); this.loading.set(false); }
    });
  }
}
