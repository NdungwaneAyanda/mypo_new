import { Component, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { APPLICATION_DOC_TYPES, REQUIRED_DOC_TYPES } from '../../core/models/application.models';

interface DocFile { type: string; label: string; required: boolean; file: File | null; }

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
            <p>Your application <strong>{{ submittedRef() }}</strong> has been received.<br>{{ submittedNote() }}</p>
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
              <div class="form-group ac-wrap">
                <label class="form-label">Customer (PO Issuer) *</label>
                <div class="ac-field">
                  <input class="form-control" autocomplete="off"
                         [value]="form.customerName"
                         (input)="onAcInput($event)"
                         (focus)="onAcFocus()"
                         (keydown)="onAcKey($event)"
                         placeholder="Type to search government entities…"
                         name="customerName" required />
                  @if (form.customerName) {
                    <button type="button" class="ac-clear" (click)="clearCustomer()" title="Clear">✕</button>
                  }
                </div>
                @if (acOpen() && acResults().length) {
                  <ul class="ac-list">
                    @for (r of acResults(); track r; let i = $index) {
                      <li class="ac-item" [class.ac-active]="i === acIndex()"
                          (mousedown)="selectCustomer(r)"
                          (mouseover)="acIndex.set(i)">
                        <span [innerHTML]="highlight(r)"></span>
                      </li>
                    }
                  </ul>
                }
                <p class="ac-hint">Can't find your entity? Just type the full name above.</p>
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

          <!-- Documents -->
          <div class="form-section">
            <div class="section-head">
              <span class="section-icon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
              <h2>Documents</h2>
            </div>
            <div class="docs-meta">
              <span>Submitted Quote, Supplier Quote, and CIPC Document are required to become Ready for Funding. You can submit now and add the rest later (PDF, DOC — max 5MB each).</span>
              <span class="docs-count" [class.complete]="hasRequiredFiles()">
                {{ attachedCount() }}/{{ docFiles.length }} attached
              </span>
            </div>
            <div class="docs-grid">
              @for (doc of docFiles; track doc.type) {
                <label class="doc-box" [class.uploaded]="doc.file" [class.required-doc]="doc.required">
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
                    <span class="doc-tag" [class.required]="doc.required">{{ doc.required ? 'Required now' : 'Submit later' }}</span>
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
            @if (canSubmit() && !loading() && !hasRequiredFiles()) {
              <p class="submit-hint">You can submit now. Status will be <strong>Provisional</strong> until Submitted Quote, Supplier Quote, and CIPC Document are uploaded.</p>
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
    .doc-box.required-doc { border-color: var(--teal); }
    .doc-tag {
      position: absolute; top: .75rem; right: .75rem;
      font-size: .65rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
      padding: .15rem .45rem; border-radius: 9999px;
      background: #ffedd5; color: #c2410c;
    }
    .doc-tag.required { background: rgba(16,185,129,.12); color: var(--teal-dark); }
    .submit-hint { color: var(--gray-500); font-size: .875rem; text-align: center; }

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

    /* ── Autocomplete ── */
    .ac-wrap { position: relative; }
    .ac-field { position: relative; display: flex; align-items: center; }
    .ac-field .form-control { padding-right: 2rem; }
    .ac-clear {
      position: absolute; right: .625rem;
      background: none; border: none; cursor: pointer;
      color: var(--muted, #65758b); font-size: .8rem; line-height: 1;
      padding: .25rem; border-radius: 50%; transition: color .15s;
    }
    .ac-clear:hover { color: #ef4444; }
    .ac-list {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: #fff; border: 1.5px solid var(--border, #c6cdd8);
      border-radius: .625rem; box-shadow: 0 8px 24px rgba(0,0,0,.10);
      max-height: 280px; overflow-y: auto; z-index: 999;
      margin: 0; padding: .375rem 0; list-style: none;
    }
    .ac-item {
      padding: .5rem .875rem; font-size: .9rem; cursor: pointer;
      color: var(--foreground, #111e33); transition: background .12s;
      line-height: 1.45;
    }
    .ac-item:hover, .ac-item.ac-active { background: var(--bg-2, #f1f4f7); }
    .ac-item mark {
      background: rgba(22,162,134,.18); color: var(--teal, #16a286);
      font-weight: 700; border-radius: 2px; padding: 0 1px;
    }
    .ac-hint { font-size: .78rem; color: var(--muted, #65758b); margin-top: .375rem; }

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
  submittedNote = signal('');

  form = {
    companyName: '', contactName: '', email: '', phone: '',
    industry: '', customerName: '', paymentTerms: '', description: '',
    poAmountStr: '', costStr: '', amountStr: '',
  };

  industries = ['Construction','Manufacturing','Mining','Agriculture','Retail','Technology','Healthcare','Logistics','Energy','Government','Other'];

  /* ── Full SA government tender-issuing entity list ── */
  readonly allEntities: string[] = [
    // National Departments
    'Department of Basic Education',
    'Department of Communications and Digital Technologies',
    'Department of Cooperative Governance and Traditional Affairs (CoGTA)',
    'Department of Correctional Services',
    'Department of Defence',
    'Department of Employment and Labour',
    'Department of Environment, Forestry and Fisheries',
    'Department of Finance',
    'Department of Health',
    'Department of Higher Education and Training',
    'Department of Home Affairs',
    'Department of Human Settlements',
    'Department of International Relations and Cooperation (DIRCO)',
    'Department of Justice and Constitutional Development',
    'Department of Land Reform and Rural Development',
    'Department of Military Veterans',
    'Department of Mineral Resources and Energy',
    'Department of Police (SAPS)',
    'Department of Public Enterprises',
    'Department of Public Service and Administration',
    'Department of Public Works and Infrastructure',
    'Department of Small Business Development',
    'Department of Social Development',
    'Department of Sport, Arts and Culture',
    'Department of Tourism',
    'Department of Trade, Industry and Competition (DTIC)',
    'Department of Transport',
    'Department of Water and Sanitation',
    'Department of Women, Youth and Persons with Disabilities',
    'National Treasury',
    'The Presidency',
    // State-Owned Enterprises
    'Eskom Holdings SOC Ltd',
    'Transnet SOC Ltd',
    'South African National Roads Agency (SANRAL)',
    'South African Broadcasting Corporation (SABC)',
    'South African Post Office (SAPO)',
    'Airports Company South Africa (ACSA)',
    'South African Airways (SAA)',
    'Industrial Development Corporation (IDC)',
    'Development Bank of Southern Africa (DBSA)',
    'Land and Agricultural Development Bank (Land Bank)',
    'South African Revenue Service (SARS)',
    'Government Employees Pension Fund (GEPF)',
    'Public Investment Corporation (PIC)',
    'Passenger Rail Agency of South Africa (PRASA)',
    'Armscor',
    'Denel SOC Ltd',
    'State Information Technology Agency (SITA)',
    'Independent Communications Authority of SA (ICASA)',
    'South African Nuclear Energy Corporation (NECSA)',
    'Central Energy Fund (CEF)',
    'South African Forestry Company (SAFCOL)',
    'Rand Water',
    'Umgeni Water',
    'Lepelle Northern Water',
    'Magalies Water',
    'Mhlathuze Water',
    'Overberg Water',
    'Sedibeng Water',
    'Bloem Water',
    'Amatola Water',
    'Ikangala Water Board',
    'Pelladrift Water Board',
    'South African Bureau of Standards (SABS)',
    'Government Printing Works',
    'South African Express Airways',
    'Air Traffic and Navigation Services (ATNS)',
    'South African Tourism',
    'Brand South Africa',
    // Constitutional Institutions
    'Independent Electoral Commission (IEC)',
    'South African Human Rights Commission (SAHRC)',
    'Office of the Public Protector',
    'National Prosecuting Authority (NPA)',
    'Financial Intelligence Centre (FIC)',
    'Auditor-General of South Africa (AGSA)',
    'South African Reserve Bank (SARB)',
    'Financial Sector Conduct Authority (FSCA)',
    'Prudential Authority',
    // Chapter 9 & Regulators
    'Competition Commission of South Africa',
    'Competition Tribunal',
    'National Regulator for Compulsory Specifications (NRCS)',
    'South African Health Products Regulatory Authority (SAHPRA)',
    'National Energy Regulator of SA (NERSA)',
    'National Consumer Commission (NCC)',
    'Companies and Intellectual Property Commission (CIPC)',
    'National Lotteries Commission (NLC)',
    'National Credit Regulator (NCR)',
    'South African Civil Aviation Authority (SACAA)',
    'South African Maritime Safety Authority (SAMSA)',
    // Research & Science
    'Council for Scientific and Industrial Research (CSIR)',
    'National Research Foundation (NRF)',
    'Human Sciences Research Council (HSRC)',
    'Agricultural Research Council (ARC)',
    'Medical Research Council (SAMRC)',
    'Council for Geoscience',
    'South African National Space Agency (SANSA)',
    'Technology Innovation Agency (TIA)',
    'National Advisory Council on Innovation (NACI)',
    // Health Entities
    'National Health Laboratory Service (NHLS)',
    'Office of Health Standards Compliance (OHSC)',
    'South African National Blood Service (SANBS)',
    // Education & Training
    'South African Qualifications Authority (SAQA)',
    'Quality Council for Trades and Occupations (QCTO)',
    'Umalusi',
    'National Student Financial Aid Scheme (NSFAS)',
    // Universities & TVET
    'University of South Africa (UNISA)',
    'University of the Witwatersrand',
    'University of Cape Town (UCT)',
    'University of KwaZulu-Natal (UKZN)',
    'University of Pretoria (UP)',
    'Stellenbosch University',
    'University of Johannesburg (UJ)',
    'University of the Free State',
    'University of the Western Cape (UWC)',
    'University of Limpopo',
    'University of Zululand',
    'Walter Sisulu University',
    'Rhodes University',
    'North-West University (NWU)',
    'Nelson Mandela University',
    'Cape Peninsula University of Technology (CPUT)',
    'Tshwane University of Technology (TUT)',
    'Durban University of Technology (DUT)',
    'Central University of Technology (CUT)',
    'Mangosuthu University of Technology (MUT)',
    'Vaal University of Technology (VUT)',
    'Sol Plaatje University',
    'University of Mpumalanga',
    'Sefako Makgatho Health Sciences University (SMU)',
    // SETA & Skills
    'Energy and Water Sector Education and Training Authority (EWSETA)',
    'Construction Education and Training Authority (CETA)',
    'Manufacturing, Engineering and Related Services SETA (merSETA)',
    'Health and Welfare Sector Education and Training Authority (HWSETA)',
    'Education, Training and Development Practices SETA (ETDP SETA)',
    'Public Service SETA (PSETA)',
    'Transport Education and Training Authority (TETA)',
    'Mining Qualifications Authority (MQA)',
    'AgriSETA',
    'BankSETA',
    'Fibre Processing and Manufacturing SETA (FP&M SETA)',
    'Food and Beverages Manufacturing Industry SETA (FoodBev SETA)',
    'Financial and Accounting Services SETA (FASSET)',
    'Insurance SETA (INSETA)',
    'Local Government SETA (LGSETA)',
    'Media, Information and Communication Technologies SETA (MICT SETA)',
    'Safety and Security SETA (SASSETA)',
    'Services SETA',
    'Wholesale and Retail SETA (W&R SETA)',
    // Provincial Governments
    'Gauteng Department of Health',
    'Gauteng Department of Education',
    'Gauteng Department of Infrastructure Development',
    'Gauteng Department of Agriculture and Rural Development',
    'Gauteng Department of Social Development',
    'Gauteng Department of Economic Development',
    'Gauteng Department of Community Safety',
    'Western Cape Department of Health',
    'Western Cape Department of Education',
    'Western Cape Department of Public Works',
    'Western Cape Department of Social Development',
    'Western Cape Department of Agriculture',
    'KwaZulu-Natal Department of Health',
    'KwaZulu-Natal Department of Education',
    'KwaZulu-Natal Department of Public Works',
    'KwaZulu-Natal Department of Social Development',
    'KwaZulu-Natal Department of Agriculture',
    'Eastern Cape Department of Health',
    'Eastern Cape Department of Education',
    'Eastern Cape Department of Roads and Public Works',
    'Eastern Cape Department of Social Development',
    'Limpopo Department of Health',
    'Limpopo Department of Education',
    'Limpopo Department of Public Works',
    'Limpopo Department of Social Development',
    'Mpumalanga Department of Health',
    'Mpumalanga Department of Education',
    'Mpumalanga Department of Public Works',
    'North West Department of Health',
    'North West Department of Education',
    'North West Department of Public Works',
    'Free State Department of Health',
    'Free State Department of Education',
    'Free State Department of Public Works',
    'Northern Cape Department of Health',
    'Northern Cape Department of Education',
    'Northern Cape Department of Public Works',
    // Metros
    'City of Johannesburg Metropolitan Municipality',
    'City of Cape Town Metropolitan Municipality',
    'eThekwini Metropolitan Municipality',
    'Ekurhuleni Metropolitan Municipality',
    'City of Tshwane Metropolitan Municipality',
    'Buffalo City Metropolitan Municipality',
    'Mangaung Metropolitan Municipality',
    'Nelson Mandela Bay Metropolitan Municipality',
    // Major Local Municipalities
    'City of Matlosana Local Municipality',
    'Emalahleni Local Municipality',
    'Steve Tshwete Local Municipality',
    'Rustenburg Local Municipality',
    'Drakenstein Local Municipality',
    'Stellenbosch Local Municipality',
    'George Local Municipality',
    'Msunduzi Local Municipality (Pietermaritzburg)',
    'Newcastle Local Municipality',
    'Emnambithi/Ladysmith Local Municipality',
    'Sol Plaatje Local Municipality (Kimberley)',
    'Moqhaka Local Municipality',
    'Matjhabeng Local Municipality',
    'Polokwane Local Municipality',
    'Thulamela Local Municipality',
    'Greater Tzaneen Local Municipality',
    'Lephalale Local Municipality',
    'Mkhondo Local Municipality',
    'Emakhazeni Local Municipality',
    'Gert Sibande District Municipality',
    'Nkangala District Municipality',
    'Ehlanzeni District Municipality',
    'Waterberg District Municipality',
    'Capricorn District Municipality',
    'Vhembe District Municipality',
    'Mopani District Municipality',
    'Sekhukhune District Municipality',
    'uThukela District Municipality',
    'iLembe District Municipality',
    'Ugu District Municipality',
    'uMgungundlovu District Municipality',
    'uMzinyathi District Municipality',
    'Alfred Nzo District Municipality',
    'Amathole District Municipality',
    'Chris Hani District Municipality',
    'Joe Gqabi District Municipality',
    'OR Tambo District Municipality',
    'Sarah Baartman District Municipality',
    'Bojanala Platinum District Municipality',
    'Dr Kenneth Kaunda District Municipality',
    'Ngaka Modiri Molema District Municipality',
    'Dr Ruth Segomotsi Mompati District Municipality',
    'Fezile Dabi District Municipality',
    'Lejweleputswa District Municipality',
    'Thabo Mofutsanyana District Municipality',
    'Xhariep District Municipality',
    'John Taolo Gaetsewe District Municipality',
    'Namakwa District Municipality',
    'Pixley ka Seme District Municipality',
    'ZF Mgcawu District Municipality',
    'ZF Mgcawu District Municipality',
    'Frances Baard District Municipality',
    'Cape Winelands District Municipality',
    'Central Karoo District Municipality',
    'Garden Route District Municipality',
    'Overberg District Municipality',
    'West Coast District Municipality',
    'City Region District Municipality',
    // Other
    'South African Local Government Association (SALGA)',
    'Municipal Infrastructure Support Agent (MISA)',
    'South African National Biodiversity Institute (SANBI)',
    'South African Weather Service (SAWS)',
    'South African Institute of Chartered Accountants (SAICA)',
    'National Housing Finance Corporation (NHFC)',
    'Housing Development Agency (HDA)',
    'Social Housing Regulatory Authority (SHRA)',
    'Community Schemes Ombud Service (CSOS)',
    'Property Management Trading Entity (PMTE)',
    'Compensation Fund',
    'Unemployment Insurance Fund (UIF)',
    'Road Accident Fund (RAF)',
    'Passenger Rail Agency of South Africa (PRASA)',
    'Cross-Border Road Transport Agency (CBRTA)',
    'Railway Safety Regulator (RSR)',
    'Ports Regulator of South Africa',
    'South African National Parks (SANParks)',
    'iSimangaliso Wetland Park Authority',
    'Isimangaliso Wetland Park',
    'South African Heritage Resources Agency (SAHRA)',
    'National Film and Video Foundation (NFVF)',
    'Blind SA',
    'National Arts Council (NAC)',
    'National Heritage Council (NHC)',
    'South African Library for the Blind',
    'Pan South African Language Board (PanSALB)',
    'South African Sports Confederation and Olympic Committee (SASCOC)',
    'Boxing South Africa',
  ].sort((a, b) => a.localeCompare(b));

  /* ── Autocomplete state ── */
  acOpen  = signal(false);
  acIndex = signal(-1);
  acQuery = '';
  acResults = signal<string[]>([]);

  onAcInput(e: Event) {
    const q = (e.target as HTMLInputElement).value;
    this.acQuery = q;
    this.form.customerName = q;          // allow free-text too
    this.acIndex.set(-1);
    if (q.trim().length < 1) { this.acResults.set([]); this.acOpen.set(false); return; }
    const lower = q.toLowerCase();
    const results = this.allEntities
      .filter(en => en.toLowerCase().includes(lower))
      .slice(0, 12);
    this.acResults.set(results);
    this.acOpen.set(results.length > 0);
  }

  onAcFocus() {
    if (this.acResults().length) this.acOpen.set(true);
  }

  onAcKey(e: KeyboardEvent) {
    const list = this.acResults();
    if (!this.acOpen() || !list.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.acIndex.set(Math.min(this.acIndex() + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.acIndex.set(Math.max(this.acIndex() - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.acIndex() >= 0) this.selectCustomer(list[this.acIndex()]);
    } else if (e.key === 'Escape') {
      this.acOpen.set(false);
    }
  }

  selectCustomer(val: string) {
    this.form.customerName = val;
    this.acQuery = val;
    this.acOpen.set(false);
    this.acResults.set([]);
  }

  clearCustomer() {
    this.form.customerName = '';
    this.acQuery = '';
    this.acResults.set([]);
    this.acOpen.set(false);
  }

  highlight(text: string): string {
    if (!this.acQuery.trim()) return text;
    const escaped = this.acQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.ac-wrap')) {
      this.acOpen.set(false);
    }
  }

  docFiles: DocFile[] = APPLICATION_DOC_TYPES.map(d => ({ ...d, file: null }));

  constructor(
    private appSvc: ApplicationService, private auth: AuthService,
    private router: Router, private toast: ToastService,
    private elRef: ElementRef
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
  hasRequiredFiles() {
    return REQUIRED_DOC_TYPES.every(type => this.docFiles.some(d => d.type === type && d.file));
  }
  canSubmit() {
    return !!(this.form.companyName && this.form.email && this.form.industry && this.form.paymentTerms);
  }

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
    if (!this.canSubmit()) {
      this.error.set('Please fill in all required fields.'); return;
    }

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
    const hasRequired = this.hasRequiredFiles();

    this.appSvc.createApplication(payload).subscribe({
      next: app => {
        const uploads = this.docFiles.filter(d => d.file);
        if (uploads.length === 0) {
          this.onSuccess(app.refCode || app.id, hasRequired);
          return;
        }
        let done = 0;
        uploads.forEach(doc => this.appSvc.uploadDocument(app.id, doc.file!, doc.type).subscribe({
          next: () => { if (++done === uploads.length) this.onSuccess(app.refCode || app.id, hasRequired); },
          error: () => { if (++done === uploads.length) this.onSuccess(app.refCode || app.id, hasRequired); }
        }));
      },
      error: err => { this.error.set(err.error?.message || 'Submission failed. Please try again.'); this.loading.set(false); }
    });
  }

  onSuccess(ref: string, hasRequired: boolean) {
    this.loading.set(false);
    this.submittedRef.set(ref);
    this.submittedNote.set(hasRequired
      ? 'It is Ready for Funding. Matching funders have been notified.'
      : 'It is Provisional until Submitted Quote, Supplier Quote, and CIPC Document are uploaded. You can add outstanding documents from your dashboard.');
    this.submitted.set(true);
    this.toast.success(`Application ${ref} submitted successfully!`);
  }

  resetForm() {
    this.submitted.set(false); this.error.set(''); this.submittedNote.set('');
    this.form = { companyName:'', contactName:'', email:'', phone:'', industry:'', customerName:'', paymentTerms:'', description:'', poAmountStr:'', costStr:'', amountStr:'' };
    this.docFiles.forEach(d => d.file = null);
    this.clearCustomer();
    this.prefillFromUser();
  }
}
