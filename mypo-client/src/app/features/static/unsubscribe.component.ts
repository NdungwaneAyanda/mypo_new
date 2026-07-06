import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-unsubscribe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="uns-page">
      <div class="uns-card">
        <div class="uns-logo"><span style="color:#1e3a5f">My</span><span style="color:#f97316">PO</span></div>
        @if (state() === 'loading') {
          <div class="spinner-dark" style="margin:2rem auto"></div>
          <p class="text-muted text-center">Validating your request...</p>
        }
        @if (state() === 'confirm') {
          <div class="uns-icon"><i class="fas fa-envelope"></i></div>
          <h2>Unsubscribe from Emails?</h2>
          <p>You are about to unsubscribe <strong>{{ email() }}</strong> from MyPO funder opportunity emails.</p>
          <div class="uns-actions">
            <button class="btn btn-danger" (click)="confirm()" [disabled]="confirming()">
              @if (confirming()) { <span class="spinner"></span> } Yes, Unsubscribe
            </button>
            <a routerLink="/" class="btn btn-ghost">Cancel</a>
          </div>
        }
        @if (state() === 'done') {
          <div class="uns-icon uns-icon-success"><i class="fas fa-check-circle"></i></div>
          <h2>Unsubscribed Successfully</h2>
          <p>You've been removed from our funder notification emails. You can re-enable them from your dashboard at any time.</p>
          <a routerLink="/" class="btn btn-primary mt-4">Back to Home</a>
        }
        @if (state() === 'error') {
          <div class="uns-icon uns-icon-error"><i class="fas fa-times-circle"></i></div>
          <h2>Invalid Link</h2>
          <p>This unsubscribe link is invalid or has already been used.</p>
          <a routerLink="/" class="btn btn-outline mt-4">Back to Home</a>
        }
      </div>
    </div>
  `,
  styles: [`
    .uns-page { min-height: calc(100vh - 140px); display: flex; align-items: center; justify-content: center; background: var(--gray-50); padding: 2rem; }
    .uns-card { background: #fff; border-radius: .75rem; box-shadow: var(--shadow-lg); padding: 2.5rem 2rem; width: 100%; max-width: 460px; text-align: center; }
    .uns-logo { font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; }
    .uns-icon { font-size: 3rem; margin-bottom: 1rem; color: #65758b; }
    .uns-icon-success { color: #16a286; }
    .uns-icon-error   { color: #ef4444; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: .75rem; }
    p { color: var(--gray-500); line-height: 1.6; margin-bottom: 1rem; }
    .uns-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 1.25rem; }
    .spinner-dark { width: 32px; height: 32px; border: 3px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin .7s linear infinite; }
  `]
})
export class UnsubscribeComponent implements OnInit {
  state = signal<'loading' | 'confirm' | 'done' | 'error'>('loading');
  email = signal('');
  confirming = signal(false);
  private token = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) { this.state.set('error'); return; }

    this.http.get<{ email: string }>(`${environment.apiUrl}/unsubscribe?token=${this.token}`).subscribe({
      next: res => { this.email.set(res.email); this.state.set('confirm'); },
      error: () => this.state.set('error')
    });
  }

  confirm() {
    this.confirming.set(true);
    this.http.post(`${environment.apiUrl}/unsubscribe`, { token: this.token }).subscribe({
      next: () => { this.state.set('done'); this.confirming.set(false); },
      error: () => { this.state.set('error'); this.confirming.set(false); }
    });
  }
}
