import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>My Profile</h1>
        <p>Update your company details and account settings.</p>
      </div>
    </div>

    <div class="container section-sm" style="max-width:760px">
      <div class="profile-grid">
        <!-- Profile form -->
        <div class="card">
          <div class="card-header"><h3>Company Details</h3></div>
          @if (profError()) { <div class="alert alert-error">{{ profError() }}</div> }
          @if (profOk())    { <div class="alert alert-success">Profile updated successfully.</div> }
          <form (ngSubmit)="saveProfile()">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Company Name</label>
                <input class="form-control" [(ngModel)]="prof.companyName" name="co" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Name</label>
                <input class="form-control" [(ngModel)]="prof.contactName" name="cn" />
              </div>
              <div class="form-group">
                <label class="form-label">Email <span class="locked-hint">— cannot be changed</span></label>
                <input class="form-control field-locked" type="email" [(ngModel)]="prof.email" name="em" disabled />
              </div>
              <div class="form-group">
                <label class="form-label">Phone <span class="locked-hint">— cannot be changed here</span></label>
                <input class="form-control field-locked" [(ngModel)]="prof.phone" name="ph" disabled />
              </div>
            </div>
            <button class="btn btn-primary" type="submit" [disabled]="savingProf()">
              @if (savingProf()) { <span class="spinner"></span> } Save Changes
            </button>
          </form>
        </div>

        <!-- Password form -->
        <div class="card">
          <div class="card-header"><h3>Change Password</h3></div>
          @if (pwError()) { <div class="alert alert-error">{{ pwError() }}</div> }
          @if (pwOk())    { <div class="alert alert-success">Password changed successfully.</div> }
          <form (ngSubmit)="changePassword()">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input class="form-control" type="password" [(ngModel)]="pw.current" name="cur" />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input class="form-control" type="password" [(ngModel)]="pw.newPw" name="np" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input class="form-control" type="password" [(ngModel)]="pw.confirm" name="cf" />
            </div>
            <button class="btn btn-dark" type="submit" [disabled]="savingPw()">
              @if (savingPw()) { <span class="spinner spinner-teal"></span> } Update Password
            </button>
          </form>
        </div>

        <!-- Account info -->
        <div class="card account-info">
          <div class="card-header"><h3>Account Info</h3></div>
          <div class="info-rows">
            <div class="info-row"><span>Email</span><strong>{{ auth.currentUser()?.email }}</strong></div>
            <div class="info-row"><span>Roles</span><strong>{{ (auth.currentUser()?.roles || []).join(', ') || '—' }}</strong></div>
            <div class="info-row"><span>Ref Code</span><strong>{{ auth.currentUser()?.profile?.refCode || '—' }}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .info-rows { display: flex; flex-direction: column; gap: .5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: .625rem 0; border-bottom: 1px solid var(--gray-100); font-size: .9375rem; }
    .info-row:last-child { border-bottom: none; }
    .info-row span { color: var(--gray-500); }
    .info-row strong { color: var(--gray-800); }
    .field-locked { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; border-color: #e5e7eb; }
    .field-locked:focus { box-shadow: none; border-color: #e5e7eb; }
    .locked-hint { font-size: .75rem; font-weight: 400; color: #9ca3af; }
  `]
})
export class ProfileComponent {
  prof     = { companyName:'', contactName:'', email:'', phone:'' };
  pw       = { current:'', newPw:'', confirm:'' };
  savingProf = signal(false); savingPw = signal(false);
  profError  = signal(''); profOk = signal(false);
  pwError    = signal(''); pwOk   = signal(false);

  constructor(public auth: AuthService, private http: HttpClient, private toast: ToastService) {
    const p = auth.currentUser()?.profile;
    if (p) { this.prof.companyName = p.companyName||''; this.prof.contactName = p.contactName||''; this.prof.email = p.email||''; this.prof.phone = p.phone||''; }
  }

  saveProfile() {
    this.savingProf.set(true); this.profError.set(''); this.profOk.set(false);
    this.http.put(`${environment.apiUrl}/profile`, this.prof).subscribe({
      next: () => { this.auth.refreshMe().subscribe(); this.profOk.set(true); this.savingProf.set(false); this.toast.success('Profile updated!'); },
      error: err => { this.profError.set(err.error?.message||'Update failed.'); this.savingProf.set(false); }
    });
  }

  changePassword() {
    this.pwError.set(''); this.pwOk.set(false);
    if (this.pw.newPw !== this.pw.confirm) { this.pwError.set('Passwords do not match.'); return; }
    if (this.pw.newPw.length < 8) { this.pwError.set('Password must be at least 8 characters.'); return; }
    this.savingPw.set(true);
    this.http.post(`${environment.apiUrl}/auth/change-password`, { currentPassword: this.pw.current, newPassword: this.pw.newPw }).subscribe({
      next: () => { this.pwOk.set(true); this.savingPw.set(false); this.pw = { current:'', newPw:'', confirm:'' }; this.toast.success('Password changed!'); },
      error: err => { this.pwError.set(err.error?.message||'Failed to change password.'); this.savingPw.set(false); }
    });
  }
}
