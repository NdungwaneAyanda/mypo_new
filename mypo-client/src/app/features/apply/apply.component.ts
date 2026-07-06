import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface DocFile { type: string; label: string; file: File | null; }

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="apply-page">
      @if (submitted()) {
        <div class="success-wrap">
          <div class="success-card">
            <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h2>Application Submitted!</h2>
            <p>Your application <strong>{{ submittedRef() }}</strong> has been received.<br>We'll notify matching funders and keep you updated.</p>
            <div class="success-actions">
              <a routerLink="/dashboard" class="btn btn-dark">View My Applications</a>
              <button class="btn btn-outline" (click)="resetForm()">Submit Another</button>
            </div>
          </div>
        </div>
      } @else {
        <div class="apply-heading">
          <h1>Apply for PO Funding</h1>
          <p>Complete the form below and get connected with funders ready to finance your purchase orders</p>
        </div>

        <div class="form-card">
          @if (error()) { <div class="alert alert-error" style="margin-bottom:1.5rem">{{ error() }}</div> }

          <!-- Company Information -->
          <div class="form-section">
            <div class="section-head">
              <span class="section-icon"><i class="fa-solid fa-building-user"></i></span>
              <h2>Company Information</h2>
            </div>
            <div class="field-grid">
              <div class="form-group">
                <label class="form-label">Company Name *</label>
                <input class="form-control" [(ngModel)]="form.companyName" name="companyName" required placeholder="Your company name" />
              </div>
              <div class="form-group">
                <label class="form-label">Industry *</label>
                <select class="form-control" [(ngModel)]="form.industry" name="industry" required>
                  <option value="">Select industry</option>
                  @for (i of industries; track i) { <option>{{ i }}</option> }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Contact Name *</label>
                <input class="form-control" [(ngModel)]="form.contactName" name="contactName" required placeholder="Full name" />
              </div>
              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input class="form-control" type="email" [(ngModel)]="form.email" name="email" required placeholder="your@email.com" />
              </div>
              <div class="form-group span-full">
                <label class="form-label">Phone Number</label>
                <input class="form-control half-width" [(ngModel)]="form.phone" name="phone" placeholder="(012) 345-6789" />
              </div>
            </div>
          </div>

          <!-- Purchase Order Details -->
          <div class="form-section">
            <div class="section-head">
              <span class="section-icon"><i class="fa-solid fa-file-invoice-dollar"></i></span>
              <h2>Purchase Order Details</h2>
            </div>
            <div class="field-grid">
              <div class="form-group">
                <label class="form-label">PO Amount (ZAR) *</label>
                <div class="input-prefix">
                  <span class="prefix">R</span>
                  <input class="form-control" type="text" [(ngModel)]="form.poAmountStr" name="poAmount" required placeholder="50,000" (blur)="formatAmt('po')" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Cost of Delivery (ZAR) *</label>
                <div class="input-prefix">
                  <span class="prefix">R</span>
                  <input class="form-control" type="text" [(ngModel)]="form.costStr" name="cost" required placeholder="10,000" (blur)="formatAmt('cost')" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Amount Needed from Funder (ZAR) *</label>
                <div class="input-prefix">
                  <span class="prefix">R</span>
                  <input class="form-control" type="text" [(ngModel)]="form.amountStr" name="amount" required placeholder="40,000" (blur)="formatAmt('amount')" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Customer Name *</label>
                <input class="form-control" [(ngModel)]="form.customerName" name="customerName" required placeholder="Who issued the PO" />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Terms *</label>
                <select class="form-control terms-select" [(ngModel)]="form.paymentTerms" name="terms" required>
                  <option value="">Select terms</option>
                  <option value="30">30 days</option>
                  <option value="45">45 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
              <div class="form-group span-full">
                <label class="form-label">Additional Details</label>
                <textarea class="form-control" [(ngModel)]="form.description" name="desc" rows="4"
                  placeholder="Tell us more about this purchase order, your business history, or any relevant information..."></textarea>
              </div>
            </div>
          </div>

          <!-- Required Documents -->
          <div class="form-section">
            <div class="section-head">
              <span class="section-icon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
              <h2>Required Documents</h2>
            </div>
            <div class="docs-meta">
              <span>Upload required documents (PDF, DOC — max 5MB each)</span>
              <span class="docs-count" [class.complete]="attachedCount() === docFiles.length">
                {{ attachedCount() }}/{{ docFiles.length }} attached
              </span>
            </div>
            <div class="docs-grid">
              @for (doc of docFiles; track doc.type) {
                <label class="doc-box" [class.uploaded]="doc.file">
                  <input type="file" accept=".pdf,.doc,.docx" (change)="onFile($event, doc)" style="display:none" />
                  @if (doc.file) {
                    <span class="doc-uploaded-icon"><i class="fa-solid fa-circle-check"></i></span>
                    <div class="doc-box-name">{{ doc.label }}</div>
                    <div class="doc-file-name">{{ doc.file.name }}</div>
                    <span class="doc-info" title="Click to replace"><i class="fa-solid fa-rotate-left"></i></span>
                  } @else {
                    <span class="doc-upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
                    <div class="doc-box-name">{{ doc.label }}</div>
                    <div class="doc-click">Click to upload</div>
                    <span class="doc-info" title="Required document"><i class="fa-solid fa-circle-info"></i></span>
                  }
                </label>
              }
            </div>
          </div>

          <!-- Submit -->
          <div class="submit-area">
            <button class="btn btn-submit" (click)="submit()" [disabled]="loading() || !canSubmit()">
              @if (loading()) { <span class="spinner"></span> }
              @else { Submit Application → }
            </button>
            @if (!canSubmit() && !loading()) {
              <p class="submit-warning">Please attach all required documents before submitting.</p>
            }
            <p class="submit-note">By submitting, you agree to our terms and authorize us to share your information with our funder network.</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .apply-page { background: var(--bg, #f6f8fa); min-height: 100vh; padding-bottom: 4rem; }

    /* heading */
    .apply-heading { text-align: center; padding: 3.5rem 1.5rem 2rem; }
    .apply-heading h1 { font-size: 2.5rem; font-weight: 700; color: var(--foreground, #111e33); margin-bottom: .5rem; letter-spacing: -.03em; }
    .apply-heading p  { color: var(--muted, #65758b); font-size: 1rem; max-width: 540px; margin: 0 auto; }

    /* card */
    .form-card { background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%); border-radius: var(--radius-lg, 1rem); box-shadow: var(--shadow-md); max-width: 760px; margin: 0 auto; padding: 2rem 2rem 1.5rem; border: 1px solid var(--border, #c6cdd8); }

    /* section */
    .form-section { margin-bottom: 2rem; }
    .form-section:last-of-type { margin-bottom: 0; }
    .section-head { display: flex; align-items: center; gap: .625rem; margin-bottom: 1.25rem; padding-bottom: .75rem; border-bottom: 1.5px solid var(--bg-2, #f1f4f7); }
    .section-icon { font-size: 1.2rem; }
    .section-head h2 { font-size: 1.0625rem; font-weight: 600; color: var(--foreground, #111e33); margin: 0; }

    /* fields */
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .span-full  { grid-column: 1 / -1; }
    .half-width { max-width: 48%; }
    .terms-select { max-width: 48%; }

    /* currency prefix */
    .input-prefix { position: relative; display: flex; align-items: center; }
    .prefix { position: absolute; left: .875rem; color: var(--gray-500); font-weight: 600; font-size: .9375rem; pointer-events: none; z-index: 1; }
    .input-prefix .form-control { padding-left: 1.875rem; }

    /* docs */
    .docs-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: .875rem; font-size: .875rem; color: var(--gray-500); }
    .docs-count { font-weight: 700; color: var(--teal-dark); background: rgba(16,185,129,.1); padding: .175rem .6rem; border-radius: 9999px; }
    .docs-count.complete { background: rgba(16,185,129,.15); color: var(--teal-dark); }
    .docs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .doc-box {
      position: relative; display: flex; flex-direction: column; align-items: flex-start;
      gap: .2rem; padding: .875rem 1rem; border: 1.5px dashed var(--gray-300);
      border-radius: 10px; cursor: pointer; transition: all .2s; background: #fff;
    }
    .doc-box:hover { border-color: var(--teal); background: rgba(16,185,129,.02); }
    .doc-box.uploaded { border-color: var(--teal); border-style: solid; background: rgba(16,185,129,.04); }
    .doc-upload-icon { font-size: 1.1rem; color: var(--gray-400); margin-bottom: .1rem; }
    .doc-uploaded-icon { font-size: 1rem; margin-bottom: .1rem; }
    .doc-box-name { font-size: .875rem; font-weight: 600; color: var(--gray-800); }
    .doc-click { font-size: .8125rem; color: var(--teal); }
    .doc-file-name { font-size: .75rem; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .doc-info { position: absolute; top: .75rem; right: .75rem; color: var(--gray-400); font-size: .85rem; cursor: pointer; }
    .doc-box.uploaded .doc-info { color: var(--teal); }

    /* submit */
    .submit-area { margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1.5px solid var(--bg-2, #f1f4f7); display: flex; flex-direction: column; align-items: center; gap: .625rem; }
    .btn-submit {
      display: inline-flex; align-items: center; gap: .625rem;
      background: var(--gradient-accent, linear-gradient(135deg, #16a286 0%, #1ec9a8 100%));
      color: #fff;
      padding: .875rem 2.5rem; border-radius: var(--radius, .75rem);
      font-size: 1rem; font-weight: 600; border: none; cursor: pointer;
      transition: opacity .2s; letter-spacing: .01em;
      box-shadow: var(--shadow-accent, 0 8px 30px -4px rgba(22,162,134,.3));
    }
    .btn-submit:hover:not(:disabled) { opacity: .9; }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
    .submit-warning { color: #dc2626; font-size: .875rem; font-weight: 500; }
    .submit-note { color: var(--gray-400); font-size: .8125rem; text-align: center; }

    /* success */
    .success-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 64px); padding: 2rem 1.5rem; }
    .success-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,.07); padding: 3rem 2rem; text-align: center; max-width: 480px; width: 100%; }
    .success-icon { font-size: 3.5rem; margin-bottom: 1rem; color: #10b981; }
    .success-card h2 { font-size: 1.75rem; font-weight: 800; color: var(--teal-dark); margin-bottom: .75rem; }
    .success-card p  { color: var(--gray-500); line-height: 1.7; margin-bottom: 1.75rem; }
    .success-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    @media (max-width: 640px) {
      .field-grid { grid-template-columns: 1fr; }
      .docs-grid  { grid-template-columns: 1fr; }
      .half-width, .terms-select { max-width: 100%; }
      .form-card { padding: 1.25rem; }
    }
  `]
})
export class ApplyComponent {
  loading    = signal(false);
  error      = signal('');
  submitted  = signal(false);
  submittedRef = signal('');

  form = {
    companyName: '', contactName: '', email: '', phone: '',
    industry: '', customerName: '', paymentTerms: '', description: '',
    poAmountStr: '', costStr: '', amountStr: '',
  };

  industries = ['Construction','Manufacturing','Mining','Agriculture','Retail','Technology','Healthcare','Logistics','Energy','Government','Other'];

  docFiles: DocFile[] = [
    { type: 'purchase_order',            label: 'Purchase Order',               file: null },
    { type: 'company_registration',      label: 'Company Registration Document', file: null },
    { type: 'bank_confirmation',         label: 'Bank Confirmation Letter',      file: null },
    { type: 'director_id',              label: 'Director ID',                   file: null },
    { type: 'company_proof_of_address',  label: 'Company Proof of Address',      file: null },
    { type: 'director_proof_of_address', label: 'Director Proof of Address',     file: null },
  ];

  constructor(
    private appSvc: ApplicationService, private auth: AuthService,
    private router: Router, private toast: ToastService
  ) {
    this.prefillFromUser();
  }

  private prefillFromUser() {
    const user = this.auth.currentUser();
    if (!user) return;
    const p = user.profile;
    // Always use the auth email as the authoritative source
    this.form.email       = p?.email        || user.email || '';
    this.form.companyName = p?.companyName  || '';
    this.form.contactName = p?.contactName  || '';
    this.form.phone       = p?.phone        || '';
  }

  attachedCount() { return this.docFiles.filter(d => d.file).length; }
  canSubmit() { return this.docFiles.every(d => d.file !== null); }

  parseAmt(s: string) { return parseFloat(s.replace(/[^\d.]/g, '')) || 0; }

  formatAmt(field: 'po' | 'cost' | 'amount') {
    const map = { po: 'poAmountStr', cost: 'costStr', amount: 'amountStr' } as const;
    const key = map[field];
    const raw = this.parseAmt((this.form as any)[key]);
    if (raw > 0) (this.form as any)[key] = raw.toLocaleString('en-ZA');
  }

  onFile(e: Event, doc: DocFile) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { this.toast.error(`${doc.label} must be under 5MB.`); return; }
    doc.file = f;
  }

  submit() {
    if (!this.form.companyName || !this.form.email || !this.form.industry || !this.form.paymentTerms) {
      this.error.set('Please fill in all required fields.'); return;
    }
    if (!this.canSubmit()) { this.error.set('Please attach all required documents.'); return; }

    this.loading.set(true); this.error.set('');
    const payload = {
      companyName:    this.form.companyName,
      contactName:    this.form.contactName,
      email:          this.form.email,
      phone:          this.form.phone,
      industry:       this.form.industry,
      customerName:   this.form.customerName,
      paymentTerms:   this.form.paymentTerms,
      description:    this.form.description,
      poAmount:       this.parseAmt(this.form.poAmountStr),
      costOfDelivery: this.parseAmt(this.form.costStr),
      amountNeeded:   this.parseAmt(this.form.amountStr),
    };

    this.appSvc.createApplication(payload).subscribe({
      next: app => {
        let done = 0;
        const uploads = this.docFiles.filter(d => d.file);
        uploads.forEach(doc => this.appSvc.uploadDocument(app.id, doc.file!, doc.type).subscribe({
          next: () => { if (++done === uploads.length) this.onSuccess(app.refCode || app.id); },
          error: () => { if (++done === uploads.length) this.onSuccess(app.refCode || app.id); }
        }));
      },
      error: err => { this.error.set(err.error?.message || 'Submission failed. Please try again.'); this.loading.set(false); }
    });
  }

  onSuccess(ref: string) {
    this.loading.set(false); this.submittedRef.set(ref); this.submitted.set(true);
    this.toast.success(`Application ${ref} submitted successfully!`);
  }

  resetForm() {
    this.submitted.set(false); this.error.set('');
    this.form = { companyName:'', contactName:'', email:'', phone:'', industry:'', customerName:'', paymentTerms:'', description:'', poAmountStr:'', costStr:'', amountStr:'' };
    this.docFiles.forEach(d => d.file = null);
    this.prefillFromUser();
  }
}
