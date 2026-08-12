import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-page">

      <!-- Page heading -->
      <div class="contact-heading">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you. Get in touch with the MyPO team.</p>
      </div>

      <div class="contact-body">

        <!-- Message form card -->
        <div class="content-card">
          <h2 class="card-title">Send us a message</h2>
          <p class="card-sub">We'll reply within one business day.</p>

          @if (sent()) {
            <div class="sent-state">
              <div class="sent-icon">✉️</div>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We'll get back to you shortly.</p>
              <button class="send-btn" (click)="sent.set(false); resetForm()">Send another message</button>
            </div>
          } @else {
            @if (error()) { <div class="form-error">{{ error() }}</div> }
            <form (ngSubmit)="send()">
              <div class="field-row">
                <div class="form-group">
                  <label class="form-label">Name</label>
                  <input class="form-control" [(ngModel)]="form.name" name="name" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-control" type="email" [(ngModel)]="form.email" name="email" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Subject (optional)</label>
                <input class="form-control" [(ngModel)]="form.subject" name="subject" />
              </div>
              <div class="form-group">
                <label class="form-label">Message</label>
                <textarea class="form-control msg-textarea" [(ngModel)]="form.message" name="message" required rows="6"></textarea>
              </div>
              <button class="send-btn" type="submit" [disabled]="loading()">
                @if (loading()) { <span class="mini-spinner"></span> }
                Send Message →
              </button>
            </form>
          }
        </div>

        <!-- Email card -->
        <div class="content-card info-card">
          <div class="info-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div class="info-body">
            <strong>Email</strong>
            <a href="mailto:info@mypo.co.za" class="info-link">info&#64;mypo.co.za</a>
            <span class="info-note">We aim to respond within one business day.</span>
          </div>
        </div>

        <!-- Office card -->
        <div class="content-card info-card">
          <div class="info-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="info-body">
            <strong>Office</strong>
            <span class="info-addr">
              Country Club Estate<br>
              Building 2, Woodlands Drive<br>
              Woodmead<br>
              Johannesburg<br>
              2052<br>
              South Africa
            </span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .contact-page {
      background: var(--bg, #f6f8fa);
      min-height: calc(100vh - 80px);
      padding-bottom: 4rem;
    }

    /* heading */
    .contact-heading {
      text-align: center;
      padding: 4rem 1.5rem 2rem;
    }
    .contact-heading h1 {
      font-size: 2.75rem; font-weight: 700;
      color: var(--foreground, #111e33); margin-bottom: .5rem;
      letter-spacing: -.03em;
    }
    .contact-heading p { color: var(--muted, #65758b); font-size: 1.125rem; }

    /* body */
    .contact-body {
      max-width: 740px; margin: 0 auto;
      padding: 0 1.5rem;
      display: flex; flex-direction: column; gap: 1rem;
    }

    /* cards */
    .content-card {
      background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%);
      border: 1px solid var(--border, #c6cdd8);
      border-radius: var(--radius-lg, 1rem);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .card-title { font-size: 1.375rem; font-weight: 700; color: var(--foreground, #111e33); margin-bottom: .3rem; letter-spacing: -.02em; }
    .card-sub   { font-size: .9rem; color: var(--muted, #65758b); margin-bottom: 1.25rem; }

    /* form */
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: .875rem; }
    .form-label { display: block; font-size: .875rem; font-weight: 500; color: var(--gray-700, #334155); margin-bottom: .35rem; }
    .form-control {
      width: 100%; padding: .65rem .875rem;
      border: 1.5px solid var(--border, #c6cdd8); border-radius: var(--radius, .75rem);
      font-size: .9375rem; color: var(--foreground, #111e33); background: #fff;
      outline: none; transition: border-color .2s, box-shadow .2s;
    }
    .form-control:focus { border-color: var(--teal, #16a286); box-shadow: 0 0 0 3px rgba(22,162,134,.12); }
    .msg-textarea { resize: vertical; min-height: 140px; }
    .form-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: var(--radius, .75rem); padding: .625rem .875rem; font-size: .875rem; margin-bottom: 1rem; }

    /* send button */
    .send-btn {
      display: inline-flex; align-items: center; gap: .5rem;
      background: var(--navy, #111e33); color: #fff; border: none;
      padding: .7rem 1.5rem; border-radius: var(--radius, .75rem);
      font-size: .9375rem; font-weight: 600; cursor: pointer;
      transition: background .2s; margin-top: .25rem;
    }
    .send-btn:hover:not(:disabled) { background: var(--navy-2, #1b294b); }
    .send-btn:disabled { opacity: .6; cursor: not-allowed; }

    /* sent state */
    .sent-state { text-align: center; padding: 1.5rem 0; }
    .sent-icon { font-size: 2.5rem; margin-bottom: .75rem; }
    .sent-state h3 { font-size: 1.25rem; font-weight: 700; color: var(--teal, #16a286); margin-bottom: .4rem; }
    .sent-state p  { color: var(--muted, #65758b); font-size: .9375rem; margin-bottom: 1.25rem; }

    /* info cards */
    .info-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1.5rem; }
    .info-icon-wrap {
      width: 48px; height: 48px; background: rgba(22,162,134,.1);
      border-radius: var(--radius, .75rem); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .info-body { display: flex; flex-direction: column; gap: .25rem; }
    .info-body strong { font-size: .9375rem; font-weight: 700; color: var(--foreground, #111e33); }
    .info-link { color: var(--teal, #16a286); font-size: .9375rem; text-decoration: none; font-weight: 500; }
    .info-link:hover { text-decoration: underline; }
    .info-note { font-size: .875rem; color: var(--muted, #65758b); }
    .info-addr { font-size: .9rem; color: var(--muted, #65758b); line-height: 1.7; }

    /* spinner */
    .mini-spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .field-row { grid-template-columns: 1fr; }
      .content-card { padding: 1.25rem; }
    }
  `]
})
export class ContactComponent {
  form    = { name: '', email: '', subject: '', message: '' };
  loading = signal(false);
  error   = signal('');
  sent    = signal(false);

  constructor(private http: HttpClient, private toast: ToastService) {}

  resetForm() { this.form = { name: '', email: '', subject: '', message: '' }; }

  send() {
    if (!this.form.name || !this.form.email || !this.form.message) {
      this.error.set('Please fill in your name, email and message.'); return;
    }
    this.loading.set(true); this.error.set('');
    this.http.post(`${environment.apiUrl}/contact`, this.form).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); this.toast.success('Message sent!'); },
      error: err => { this.error.set(err.error?.message || 'Failed to send. Please try again.'); this.loading.set(false); }
    });
  }
}
