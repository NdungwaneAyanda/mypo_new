import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (!hideHeader()) {
      <header class="header">
        <div class="header-inner">

          <!-- Logo -->
          <a routerLink="/" class="h-logo-link" aria-label="MyPO home">
            <img src="assets/mypo-logo.png" alt="MyPO logo" class="h-logo-img" />
          </a>

          <!-- Nav -->
          <nav class="h-nav">
            <a href="#how-it-works" (click)="scrollTo($event, 'how-it-works')" class="h-link">How It Works</a>
            @if (!auth.actingAsFunder()) {
              <a routerLink="/apply" routerLinkActive="active" class="h-link">Apply for Funding</a>
            }
            @if (auth.isLoggedIn()) {
              <a routerLink="/dashboard" routerLinkActive="active" class="h-link">{{ auth.actingAsFunder() ? 'Opportunities' : 'My Applications' }}</a>
            }
            @if (!auth.actingAsFunder()) {
              <a routerLink="/register-funder" routerLinkActive="active" class="h-link">For Funders</a>
            }
          </nav>

          <!-- Right actions -->
          <div class="h-right">
            @if (auth.isLoggedIn()) {
              <div class="user-menu" (click)="dropOpen.set(!dropOpen())" [class.open]="dropOpen()">
                <div class="user-avatar">{{ userInitial() }}</div>
                <span class="user-name">{{ shortEmail() }}</span>
                <span class="drop-caret">▾</span>
                @if (dropOpen()) {
                  <div class="dropdown">
                    <a routerLink="/profile"   class="dd-item" (click)="dropOpen.set(false)"><i class="fas fa-user"></i> My Profile</a>
                    <a routerLink="/dashboard" class="dd-item" (click)="dropOpen.set(false)"><i class="fas fa-th-large"></i> Dashboard</a>
                    @if (auth.actingAsSupplier()) {
                      <a routerLink="/apply" class="dd-item" (click)="dropOpen.set(false)"><i class="fas fa-file-alt"></i> Apply</a>
                    }
                    @if (isAdmin()) {
                      <a routerLink="/admin" class="dd-item dd-admin" (click)="dropOpen.set(false)">
                        <i class="fas fa-shield-alt"></i> Admin Panel
                      </a>
                    }
                    <div class="dd-sep"></div>
                    <button class="dd-item dd-danger" (click)="logout()">→ Sign Out</button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/auth" class="signin-link">Sign In</a>
              <a routerLink="/auth" class="get-started-btn">Get Started</a>
            }
          </div>

        </div>
      </header>
    }
  `,
  styles: [`
    .header {
      background: rgba(246,248,250,.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(198,205,216,.6);
      position: sticky; top: 0; z-index: 100;
    }
    .header-inner {
      max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
      display: flex; align-items: center; height: 112px; gap: 2rem;
    }

    /* ── Logo — overflows the bar exactly like h-40 -my-6 in the original ── */
    .h-logo-link { text-decoration: none; flex-shrink: 0; display: flex; align-items: center; overflow: visible; }
    .h-logo-img  { height: 160px; width: auto; margin-top: -24px; margin-bottom: -24px; }

    /* ── Nav ── */
    .h-nav { display: flex; gap: 2rem; flex: 1; justify-content: center; }
    .h-link {
      color: var(--muted, #65758b); text-decoration: none; font-size: .9375rem;
      font-weight: 500; transition: color .2s; white-space: nowrap;
    }
    .h-link:hover { color: var(--foreground, #111e33); }
    .h-link.active { color: var(--foreground, #111e33); font-weight: 600; }

    /* ── Right ── */
    .h-right { display: flex; align-items: center; gap: .875rem; flex-shrink: 0; }
    .signin-link {
      color: var(--foreground, #111e33); text-decoration: none; font-size: .9375rem;
      font-weight: 500; transition: color .2s;
    }
    .signin-link:hover { color: var(--teal, #16a286); }
    .get-started-btn {
      background: var(--navy, #111e33);
      color: #fff; text-decoration: none;
      padding: .5rem 1.375rem; border-radius: var(--radius, .75rem);
      font-size: .9375rem; font-weight: 600;
      transition: background .2s; white-space: nowrap;
    }
    .get-started-btn:hover { background: #1b294b; }

    /* ── User menu ── */
    .user-menu {
      position: relative; display: flex; align-items: center;
      gap: .5rem; cursor: pointer; padding: .375rem .625rem;
      border-radius: var(--radius, .75rem); transition: background .2s; user-select: none;
    }
    .user-menu:hover, .user-menu.open { background: var(--bg-2, #f1f4f7); }
    .user-avatar {
      width: 34px; height: 34px;
      background: var(--gradient-accent, linear-gradient(135deg, #16a286 0%, #1ec9a8 100%));
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .875rem; color: #fff; flex-shrink: 0;
    }
    .user-name {
      color: var(--foreground, #111e33); font-size: .875rem; font-weight: 600;
      max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .drop-caret { color: var(--muted, #65758b); font-size: .7rem; }
    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border: 1px solid var(--border, #c6cdd8);
      border-radius: var(--radius-lg, 1rem); box-shadow: var(--shadow-md);
      min-width: 185px; padding: .375rem; z-index: 200;
    }
    .dd-item {
      display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem;
      border-radius: .5rem; font-size: .875rem; color: var(--foreground, #111e33);
      text-decoration: none; cursor: pointer; transition: background .15s;
      width: 100%; border: none; background: none; text-align: left; font-weight: 500;
    }
    .dd-item:hover { background: var(--bg-2, #f1f4f7); }
    .dd-sep { height: 1px; background: var(--bg-2, #f1f4f7); margin: .25rem 0; }
    .dd-admin { color: #111e33; font-weight: 600; }
    .dd-admin:hover { background: #f1f4f7; }
    .dd-danger { color: #ef4444; }
    .dd-danger:hover { background: #fef2f2; }

    @media (max-width: 768px) {
      .h-nav { display: none; }
      .user-name { display: none; }
      .h-logo-img { height: 120px; margin-top: -16px; margin-bottom: -16px; }
      .header-inner { height: 88px; }
    }
  `]
})
export class HeaderComponent {
  hideHeader = signal(false);
  dropOpen   = signal(false);

  constructor(public auth: AuthService, private router: Router) {
    const authPages = ['/auth', '/forgot-password', '/reset-password'];
    const shouldHide = (url: string) => authPages.includes(url.split('?')[0]);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.hideHeader.set(shouldHide(e.urlAfterRedirects));
      this.dropOpen.set(false);
    });
    this.hideHeader.set(shouldHide(this.router.url));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (!(e.target as HTMLElement).closest('.user-menu')) this.dropOpen.set(false);
  }

  scrollTo(e: Event, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else this.router.navigate(['/'], { fragment: id });
  }

  userInitial() { return (this.auth.currentUser()?.email?.[0] || 'U').toUpperCase(); }
  shortEmail()  { return this.auth.currentUser()?.email?.split('@')[0] || ''; }
  isAdmin()     { return this.auth.currentUser()?.roles?.includes('admin'); }
  logout()      { this.dropOpen.set(false); this.auth.logout(); }
}
