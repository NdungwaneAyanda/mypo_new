import { Component, signal } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (showFooter()) {
      <footer class="site-footer">
        <div class="footer-inner">
          <a routerLink="/" aria-label="MyPO home" class="f-logo-wrap">
            <img src="assets/mypo-logo.png" alt="MyPO" class="f-logo-img" />
          </a>
          <div class="f-links">
            <a routerLink="/about">About</a>
            <a routerLink="/privacy">Privacy Policy</a>
            <a routerLink="/terms">Terms of Service</a>
            <a routerLink="/contact">Contact Us</a>
          </div>
          <p class="f-copy">© {{ year }} MyPO. All rights reserved.</p>
        </div>
      </footer>
    }
  `,
  styles: [`
    .site-footer {
      background: var(--navy, #111e33);
      padding: 1.25rem 1.5rem;
      margin-top: auto;
    }
    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center;
      justify-content: space-between; flex-wrap: wrap; gap: 1.5rem;
    }
    .f-logo-wrap {
      background: #fff; border-radius: 12px;
      padding: .5rem .75rem; display: inline-flex; align-items: center;
    }
    .f-logo-img { height: 80px; width: auto; display: block; }
    .f-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .f-links a {
      color: rgba(255,255,255,.6); text-decoration: none;
      font-size: .9rem; font-weight: 500; transition: color .2s;
    }
    .f-links a:hover { color: #fff; }
    .f-copy { color: rgba(255,255,255,.4); font-size: .85rem; }
    @media (max-width: 640px) {
      .footer-inner { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class FooterComponent {
  showFooter = signal(false);
  year = new Date().getFullYear();

  /* hide only on auth pages — global footer shows everywhere else */
  private hidden = ['/auth', '/forgot-password', '/reset-password'];

  constructor(private router: Router) {
    const check = (url: string) => !this.hidden.includes(url.split('?')[0]);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.showFooter.set(check(e.urlAfterRedirects));
    });
    this.showFooter.set(check(this.router.url));
  }
}
