import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FunderService } from '../../core/services/funder.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register-funder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="rf-bg">
      <div class="rf-wrap">

        <!-- Header -->
        <div class="rf-head">
          <div class="rf-badge"><i class="fas fa-hand-holding-usd"></i> Funder Account</div>
          <h1>Join Our Funder Network</h1>
          <p>Register to browse pre-vetted PO funding opportunities from verified South African suppliers.</p>
          <p class="rf-switch-note">
            Looking to get funded instead?
            <a routerLink="/auth" class="rf-link">Apply as a Supplier</a>
            &nbsp;·&nbsp;
            Already a funder?
            <a routerLink="/auth" [queryParams]="{ role: 'funder' }" class="rf-link">Sign in</a>
          </p>
        </div>

        @if (registered()) {
          <div class="success-panel">
            <div class="success-icon"><i class="fas fa-trophy"></i></div>
            <h2>Welcome to MyPO!</h2>
            <p>Your funder account has been created. Head to your dashboard to start browsing opportunities.</p>
            <a routerLink="/dashboard" class="btn btn-primary">Go to Dashboard</a>
          </div>
        } @else {
          @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

          <form class="rf-form" (ngSubmit)="submit()">

            <!-- Account credentials -->
            <div class="rf-section">
              <h3 class="section-label"><i class="fas fa-lock"></i> Account Credentials</h3>
              <div class="grid-2">
                <div class="form-group full">
                  <label class="form-label">Email Address *</label>
                  <input class="form-control" type="email" [(ngModel)]="form.email" name="email" required
                         placeholder="you@company.com" autocomplete="off" />
                </div>
                <div class="form-group">
                  <label class="form-label">Password *</label>
                  <input class="form-control" type="password" [(ngModel)]="form.password" name="password"
                         required minlength="8" placeholder="Minimum 8 characters" autocomplete="new-password" />
                </div>
                <div class="form-group">
                  <label class="form-label">Confirm Password *</label>
                  <input class="form-control" type="password" [(ngModel)]="confirmPassword" name="confirmPw"
                         required placeholder="Repeat password" autocomplete="new-password" />
                </div>
              </div>
            </div>

            <!-- Company details -->
            <div class="rf-section">
              <h3 class="section-label"><i class="fas fa-building"></i> Company Details</h3>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Company Name *</label>
                  <input class="form-control" [(ngModel)]="form.companyName" name="companyName" required
                         placeholder="ABC Capital (Pty) Ltd" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Person *</label>
                  <input class="form-control" [(ngModel)]="form.contactName" name="contactName" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone *</label>
                  <input class="form-control" [(ngModel)]="form.phone" name="phone" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Company Website</label>
                  <input class="form-control" [(ngModel)]="form.companyWebsite" name="website" placeholder="https://..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Years in Business</label>
                  <input class="form-control" type="number" [(ngModel)]="form.yearsInBusiness" name="years" min="0" />
                </div>
              </div>
            </div>

            <!-- Funding preferences -->
            <div class="rf-section">
              <h3 class="section-label"><i class="fas fa-chart-line"></i> Funding Preferences</h3>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Funding Capacity</label>
                  <select class="form-control" [(ngModel)]="form.fundingCapacity" name="capacity">
                    <option value="">Select range...</option>
                    <option>R100K – R500K</option>
                    <option>R500K – R1M</option>
                    <option>R1M – R5M</option>
                    <option>R5M – R10M</option>
                    <option>R10M+</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Min PO Amount (ZAR)</label>
                  <input class="form-control" type="number" [(ngModel)]="form.minPoAmount" name="minPo" min="0" placeholder="100 000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Max PO Amount (ZAR)</label>
                  <input class="form-control" type="number" [(ngModel)]="form.maxPoAmount" name="maxPo" min="0" placeholder="5 000 000" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Industries of Interest</label>
                <div class="industry-chips">
                  @for (ind of industries; track ind) {
                    <button type="button" class="ind-chip" [class.selected]="form.industries.includes(ind)" (click)="toggleInd(ind)">{{ ind }}</button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Funding Description</label>
                <textarea class="form-control" [(ngModel)]="form.fundingDescription" name="desc" rows="3"
                          placeholder="Describe your funding approach and criteria..."></textarea>
              </div>
            </div>

            <button class="btn btn-primary btn-full" type="submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> } @else { <i class="fas fa-arrow-right"></i> }
              Create Funder Account
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .rf-bg {
      min-height: 100vh; background: linear-gradient(135deg, #111e33 0%, #1b294b 60%, #16a286 100%);
      display: flex; align-items: flex-start; justify-content: center;
      padding: 3rem 1.5rem;
    }
    .rf-wrap { width: 100%; max-width: 680px; }

    /* Header */
    .rf-head { text-align: center; color: #fff; margin-bottom: 2rem; }
    .rf-badge {
      display: inline-flex; align-items: center; gap: .5rem;
      background: rgba(22,162,134,.25); border: 1px solid rgba(22,162,134,.4);
      color: #6ee7b7; padding: .35rem 1rem; border-radius: 9999px;
      font-size: .8125rem; font-weight: 600; margin-bottom: 1rem;
    }
    .rf-head h1 { font-size: 1.875rem; font-weight: 800; margin-bottom: .5rem; }
    .rf-head p  { color: rgba(255,255,255,.65); font-size: .9375rem; margin-bottom: .25rem; }
    .rf-switch-note { font-size: .875rem; margin-top: .625rem; }
    .rf-link { color: #1ec9a8; font-weight: 600; text-decoration: none; }
    .rf-link:hover { text-decoration: underline; }

    /* Form card */
    .rf-form {
      background: #fff; border-radius: 1.25rem;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      padding: 2rem;
    }
    .rf-section { margin-bottom: 1.75rem; }
    .section-label {
      font-size: .8125rem; font-weight: 700; color: #65758b;
      text-transform: uppercase; letter-spacing: .06em;
      margin-bottom: 1rem; padding-bottom: .5rem;
      border-bottom: 1px solid #f1f4f7;
      display: flex; align-items: center; gap: .5rem;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: .35rem; }
    .form-label { font-size: .8125rem; font-weight: 600; color: #374151; }
    .form-control {
      padding: .5625rem .875rem; border: 1.5px solid #d1d9e0;
      border-radius: .625rem; font-size: .9rem; transition: border-color .2s;
      background: #fff; color: #111e33;
    }
    .form-control:focus { outline: none; border-color: #16a286; box-shadow: 0 0 0 3px rgba(22,162,134,.12); }

    /* Industry chips */
    .industry-chips { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .375rem; }
    .ind-chip {
      padding: .375rem .875rem; border: 1.5px solid #d1d9e0;
      border-radius: 9999px; background: #fff; font-size: .8125rem;
      font-weight: 600; cursor: pointer; transition: all .2s; color: #65758b;
    }
    .ind-chip:hover { border-color: #16a286; color: #16a286; }
    .ind-chip.selected { background: #16a286; color: #fff; border-color: #16a286; }

    /* Success panel */
    .success-panel {
      background: #fff; border-radius: 1.25rem; padding: 3rem 2rem;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }
    .success-icon { font-size: 3rem; color: #16a286; margin-bottom: 1rem; }
    .success-panel h2 { font-size: 1.75rem; font-weight: 800; color: #111e33; margin-bottom: .75rem; }
    .success-panel p  { color: #65758b; margin-bottom: 1.75rem; line-height: 1.6; }

    /* Alert */
    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: .75rem; padding: .875rem 1rem; margin-bottom: 1.25rem; font-size: .9rem; }

    /* Buttons */
    .btn { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem 1.25rem; border-radius: .625rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; font-size: .9375rem; transition: all .2s; }
    .btn-primary { background: #16a286; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #0e8a71; }
    .btn-full { width: 100%; justify-content: center; padding: .875rem; font-size: 1rem; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .65s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 600px) {
      .grid-2 { grid-template-columns: 1fr; }
      .rf-form { padding: 1.25rem; }
    }
  `]
})
export class RegisterFunderComponent {
  loading    = signal(false);
  error      = signal('');
  registered = signal(false);
  confirmPassword = '';

  form = {
    email: '', password: '',
    companyName: '', contactName: '', phone: '',
    companyWebsite: '', yearsInBusiness: undefined as number | undefined,
    fundingCapacity: '', fundingDescription: '',
    industries: [] as string[],
    minPoAmount: undefined as number | undefined,
    maxPoAmount: undefined as number | undefined
  };

  industries = ['Construction','Manufacturing','Mining','Agriculture','Retail','Technology','Healthcare','Logistics','Energy','Government','Other'];

  constructor(
    private funderSvc: FunderService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    // If already logged in as a funder, go straight to dashboard
    if (this.auth.isLoggedIn() && this.auth.currentUser()?.roles?.includes('funder')) {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleInd(ind: string) {
    const i = this.form.industries.indexOf(ind);
    i >= 0 ? this.form.industries.splice(i, 1) : this.form.industries.push(ind);
  }

  submit() {
    this.error.set('');
    if (this.form.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (this.form.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }

    this.loading.set(true);
    this.funderSvc.signupFunder(this.form).subscribe({
      next: res => {
        this.auth.handleAuth(res);
        this.auth.setActiveRole('funder');
        this.registered.set(true);
        this.loading.set(false);
        this.toast.success('Funder account created! Welcome to MyPO.');
      },
      error: err => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
