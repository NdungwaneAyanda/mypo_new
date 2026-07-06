import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>Privacy Policy</h1>
        <p>Last updated: January {{ currentYear }}</p>
      </div>
    </div>
    <div class="container section-sm" style="max-width:760px">
      <div class="prose-doc">
        @for (s of sections; track s.title) {
          <section>
            <h2>{{ s.title }}</h2>
            <p>{{ s.body }}</p>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .prose-doc section { margin-bottom: 2rem; }
    .prose-doc h2 { font-size: 1.2rem; font-weight: 800; color: var(--navy); margin-bottom: .625rem; }
    .prose-doc p  { color: var(--gray-600); line-height: 1.8; font-size: .9375rem; }
  `]
})
export class PrivacyComponent {
  readonly currentYear = new Date().getFullYear();
  sections = [
    { title:'1. Information We Collect',       body:'We collect information you provide when registering, submitting applications, or contacting us, including name, email, phone number, company details, and financial documents.' },
    { title:'2. How We Use Your Information',  body:'Your information is used to match you with funders, send relevant notifications, improve our platform, and comply with legal obligations.' },
    { title:'3. Data Sharing',                 body:'We share your application data only with funders on our platform who are actively reviewing opportunities. We do not sell your data to third parties.' },
    { title:'4. Data Security',                body:'We employ industry-standard encryption (TLS in transit, AES-256 at rest) to protect your information and documents.' },
    { title:'5. Cookies',                      body:'We use essential cookies to maintain your session and analytics cookies to improve the platform. You may disable cookies in your browser settings.' },
    { title:'6. Your Rights (POPIA)',          body:'Under South Africa\'s Protection of Personal Information Act, you have the right to access, correct, and request deletion of your personal information.' },
    { title:'7. Contact',                      body:'For privacy-related requests, contact our information officer at info@mypo.co.za.' },
  ];
}
