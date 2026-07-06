import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>Terms of Service</h1>
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
export class TermsComponent {
  readonly currentYear = new Date().getFullYear();
  sections = [
    { title:'1. Acceptance',          body:'By accessing MyPO, you agree to be bound by these Terms. If you disagree, please do not use the platform.' },
    { title:'2. Platform Role',       body:'MyPO is a marketplace that connects suppliers and funders. We do not provide funding ourselves and are not a financial services provider.' },
    { title:'3. Eligibility',         body:'You must be a registered South African business entity with a valid company registration number to use the platform.' },
    { title:'4. Application Accuracy',body:'You are responsible for the accuracy and completeness of all information and documents submitted. Fraudulent submissions will result in permanent bans and may be reported to authorities.' },
    { title:'5. Funder Conduct',      body:'Funders must honor offers made on the platform. Repeated unresponsive behaviour may result in removal from the network.' },
    { title:'6. Fees',                body:'MyPO does not charge suppliers to submit applications. Funders pay a success fee upon funded deals. Details are agreed during registration.' },
    { title:'7. Limitation of Liability', body:'MyPO is not liable for failed funding transactions between suppliers and funders. All funding decisions rest solely with the funder.' },
    { title:'8. Governing Law',       body:'These Terms are governed by the laws of the Republic of South Africa.' },
  ];
}
