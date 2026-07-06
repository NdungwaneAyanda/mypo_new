import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="nf-wrap">
      <div class="nf-inner">
        <div class="nf-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="btn btn-dark btn-lg">← Back to Home</a>
      </div>
    </div>
  `,
  styles: [`
    .nf-wrap { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 3rem 1.5rem; }
    .nf-inner { text-align: center; max-width: 400px; }
    .nf-code { font-size: 6rem; font-weight: 900; color: var(--gray-200); line-height: 1; margin-bottom: 1rem; }
    h1 { font-size: 1.75rem; font-weight: 800; color: var(--gray-900); margin-bottom: .625rem; }
    p  { color: var(--gray-500); margin-bottom: 2rem; line-height: 1.6; }
  `]
})
export class NotFoundComponent {}
