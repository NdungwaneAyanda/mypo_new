import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- ── HERO ── -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <!-- zap icon -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Fast &amp; Reliable PO Funding
        </div>
        <h1 class="hero-heading">
          Access a Network of
          <span class="hero-teal">Purchase Order Funders</span>
        </h1>
        <p class="hero-sub">
          Connect with verified funders ready to finance your purchase orders.
          Submit once, reach multiple funders instantly.
        </p>
        <div class="hero-ctas">
          <a routerLink="/apply" class="btn-hero-primary">
            Apply for Funding
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#how-it-works" class="btn-hero-outline">Learn How It Works</a>
        </div>
        <div class="trust-row">
          <div class="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Verified Funders Only
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            24–48 Hour Response
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Multiple Funding Options
          </div>
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ── -->
    <section class="how-section" id="how-it-works">
      <div class="container">
        <div class="section-head">
          <h2>How It Works</h2>
          <p>Get from application to funding in just a few simple steps</p>
        </div>
        <div class="steps-grid">
          @for (step of steps; track step.num) {
            <div class="step-card">
              <div class="step-num">{{ step.num }}</div>
              <div class="step-icon"><i [class]="step.iconClass"></i></div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── CTA CARDS ── -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-cards">
          <div class="cta-card">
            <div class="cta-card-icon"><i class="fas fa-file-alt"></i></div>
            <h3>Apply for PO Funding</h3>
            <p>Have a purchase order from a credible buyer? Submit your application and let our network of funders compete for your business.</p>
            <a routerLink="/apply" class="btn btn-dark btn-lg">Start Application →</a>
          </div>
          <div class="cta-card">
            <div class="cta-card-icon"><i class="fas fa-briefcase"></i></div>
            <h3>Join Our Funder Network</h3>
            <p>Are you a funder or investor looking for short-term, high-yield opportunities? Register to access pre-vetted PO funding deals.</p>
            <a routerLink="/register-funder" class="btn btn-dark btn-lg">Register as Funder →</a>
            <a routerLink="/auth" [queryParams]="{ role: 'funder' }" class="btn btn-outline btn-lg" style="margin-left:.75rem">Funder Sign In</a>
          </div>
        </div>
      </div>
    </section>

  `,
  styles: [`
    :host { display: block; }

    /* ─── HERO ─── */
    .hero {
      background: var(--gradient-hero, linear-gradient(135deg, #111e33 0%, #1b294b 50%, #224a5e 100%));
      min-height: 100vh; display: flex; align-items: flex-start;
      padding: 3rem 1.5rem 4rem; text-align: center;
    }
    .hero-inner { max-width: 860px; margin: 0 auto; width: 100%; }

    .hero-badge {
      display: inline-flex; align-items: center; gap: .5rem;
      background: rgba(22,162,134,.2); color: rgba(255,255,255,.9);
      border: 1px solid rgba(22,162,134,.35); border-radius: 9999px;
      padding: .35rem .875rem; font-size: .8125rem; font-weight: 500;
      margin-bottom: 1.25rem;
    }

    .hero-heading {
      font-size: 1.875rem; font-weight: 700;
      color: #fff; line-height: 1.15; margin-bottom: 1.25rem;
      letter-spacing: -.02em;
    }
    @media (min-width: 640px)  { .hero-heading { font-size: 2.25rem; } }
    @media (min-width: 768px)  { .hero-heading { font-size: 2.75rem; } }
    @media (min-width: 1024px) { .hero-heading { font-size: 3.25rem; } }
    .hero-teal {
      display: block; margin-top: .25rem;
      background: linear-gradient(90deg, #16a286 0%, #1ec9a8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-size: 1rem; color: rgba(255,255,255,.65); line-height: 1.7;
      margin-bottom: 2rem; max-width: 520px; margin-left: auto; margin-right: auto;
    }

    .hero-ctas {
      display: flex; gap: .875rem; justify-content: center;
      flex-wrap: wrap; margin-bottom: 2.5rem;
    }
    /* Primary — teal gradient fill */
    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .8125rem 1.75rem;
      background: var(--gradient-accent, linear-gradient(135deg, #16a286 0%, #1ec9a8 100%));
      color: #fff; border-radius: var(--radius, .75rem); font-size: 1rem; font-weight: 600;
      text-decoration: none; transition: opacity .2s;
      box-shadow: 0 8px 30px -4px rgba(22,162,134,.45);
    }
    .btn-hero-primary:hover { opacity: .88; }
    /* Secondary — white bg, dark text (matching screenshot exactly) */
    .btn-hero-outline {
      display: inline-flex; align-items: center;
      padding: .8125rem 1.75rem;
      background: rgba(255,255,255,.12); backdrop-filter: blur(4px);
      border: 1.5px solid rgba(255,255,255,.4);
      color: #fff; border-radius: var(--radius, .75rem);
      font-size: 1rem; font-weight: 600;
      text-decoration: none; transition: all .2s;
    }
    .btn-hero-outline:hover { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.7); }

    .trust-row {
      display: flex; align-items: center; justify-content: center;
      gap: 2rem; flex-wrap: wrap;
    }
    .trust-item {
      display: flex; align-items: center; gap: .625rem;
      color: rgba(255,255,255,.7); font-size: .9375rem; font-weight: 400;
    }
    .trust-item svg { color: var(--teal, #16a286); flex-shrink: 0; }
    .trust-divider { width: 1px; height: 20px; background: rgba(255,255,255,.15); }

    /* ─── HOW IT WORKS ─── */
    .how-section { background: var(--bg-2, #f1f4f7); padding: 6rem 1.5rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    .section-head { text-align: center; margin-bottom: 3.5rem; }
    .section-head h2 { font-size: 2.25rem; font-weight: 700; color: var(--foreground, #111e33); margin-bottom: .625rem; letter-spacing: -.025em; }
    .section-head p  { color: var(--muted, #65758b); font-size: 1.0625rem; }
    .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
    .step-card {
      position: relative; text-align: left; padding: 1.75rem 1.5rem;
      background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%);
      border: 1px solid var(--border, #c6cdd8); border-radius: var(--radius-lg, 1rem);
      box-shadow: var(--shadow-sm); transition: box-shadow .3s, transform .3s;
    }
    .step-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .step-num {
      position: absolute; top: -12px; left: -12px;
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      background: var(--gradient-accent, linear-gradient(135deg, #16a286 0%, #1ec9a8 100%));
      color: #fff; border-radius: 50%; font-size: .875rem; font-weight: 700;
      box-shadow: 0 4px 12px rgba(22,162,134,.35);
    }
    .step-icon {
      width: 56px; height: 56px; border-radius: var(--radius, .75rem);
      background: rgba(22,162,134,.1); display: flex; align-items: center;
      justify-content: center; font-size: 1.5rem; margin-bottom: 1rem;
      transition: transform .3s; color: #16a286;
    }
    .step-card:hover .step-icon { transform: scale(1.1); }
    .step-card h3 { font-size: 1.125rem; font-weight: 600; color: var(--foreground, #111e33); margin-bottom: .5rem; }
    .step-card p  { font-size: .9rem; color: var(--muted, #65758b); line-height: 1.65; }

    /* ─── CTA CARDS ─── */
    .cta-section { background: var(--bg, #f6f8fa); padding: 6rem 1.5rem; }
    .cta-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; max-width: 900px; margin: 0 auto; }
    .cta-card {
      background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%);
      border-radius: var(--radius-lg, 1rem); padding: 2.5rem 2rem; text-align: center;
      box-shadow: var(--shadow-md); border: 1px solid var(--border, #c6cdd8);
    }
    .cta-card-icon { font-size: 2.25rem; margin-bottom: 1.125rem; color: #16a286; }
    .cta-card h3 { font-size: 1.3125rem; font-weight: 700; color: var(--foreground, #111e33); margin-bottom: .75rem; letter-spacing: -.02em; }
    .cta-card p  { color: var(--muted, #65758b); font-size: .9375rem; line-height: 1.65; margin-bottom: 1.75rem; }


    @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 640px) {
      .steps-grid, .cta-cards { grid-template-columns: 1fr; }
      .trust-row { gap: 1rem; }
      .trust-divider { display: none; }
    }
  `]
})
export class HomeComponent {
  steps = [
    { num:1, iconClass:'fas fa-clipboard-list', title:'Submit Your Details', desc:'Fill in your company info and PO details. Takes less than 5 minutes.' },
    { num:2, iconClass:'fas fa-broadcast-tower', title:'Instant Broadcast',  desc:'Your application is instantly sent to our verified network of funders.' },
    { num:3, iconClass:'fas fa-handshake',       title:'Receive Offers',     desc:'Funders review your application and express interest within 24–48 hours.' },
    { num:4, iconClass:'fas fa-check-circle',    title:'Get Funded',         desc:'Accept the best offer and receive funding directly into your account.' },
  ];
}
