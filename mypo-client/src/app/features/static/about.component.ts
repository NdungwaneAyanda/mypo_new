import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  template: `
    <div class="about-page">

      <!-- Page heading -->
      <div class="about-heading">
        <h1>Why MyPO Exists</h1>
        <p>Helping South African suppliers turn purchase orders into cash.</p>
      </div>

      <div class="about-body">

        <!-- Problem card -->
        <div class="content-card">
          <h2 class="card-title">The problem we're solving</h2>
          <p>Every day, South African SMEs win purchase orders from large corporates and government — and then watch those opportunities slip away because they can't fund the stock, materials, or labour to deliver.</p>
          <p>Traditional banks are slow. Their PO finance products are buried under paperwork, collateral demands, and weeks of waiting. A confirmed PO from a blue-chip buyer should be a green light, not a barrier.</p>
          <p>Meanwhile, private funders across South Africa actively want short-term, asset-backed deals like PO finance — but they have no easy way to find vetted suppliers with real, executable orders in hand.</p>
          <p class="problem-bold">MyPO is the marketplace that connects them directly. Suppliers apply in minutes. Funders see qualified opportunities. Deals get done.</p>
        </div>

        <!-- 3-column value cards -->
        <div class="value-grid">
          @for (v of values; track v.title) {
            <div class="value-card">
              <div class="value-icon-wrap">
                <span class="value-icon">{{ v.icon }}</span>
              </div>
              <h3>{{ v.title }}</h3>
              <p>{{ v.desc }}</p>
            </div>
          }
        </div>

        <!-- Company information card -->
        <div class="content-card company-card">
          <div class="company-header">
            <div class="company-icon-wrap">
              <span class="company-icon">🏢</span>
            </div>
            <h2>Company Information</h2>
          </div>
          <p class="company-intro">MyPO is operated by <strong>MyPO (Pty) Ltd</strong>, a private company registered in South Africa.</p>
          <div class="company-details">
            <div class="company-detail">
              <span class="detail-label">Registered name</span>
              <span class="detail-value">MyPO (Pty) Ltd</span>
            </div>
            <div class="company-detail">
              <span class="detail-label">Jurisdiction</span>
              <span class="detail-value">South Africa</span>
            </div>
            <div class="company-detail">
              <span class="detail-label">Website</span>
              <span class="detail-value">
                <a href="https://www.mypo.co.za" target="_blank">www.mypo.co.za</a>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .about-page {
      background: var(--bg, #f6f8fa);
      min-height: calc(100vh - 80px);
      padding-bottom: 4rem;
    }

    /* heading */
    .about-heading {
      text-align: center;
      padding: 4rem 1.5rem 2rem;
    }
    .about-heading h1 {
      font-size: 2.75rem; font-weight: 700;
      color: var(--foreground, #111e33); margin-bottom: .5rem;
      letter-spacing: -.03em;
    }
    .about-heading p {
      color: var(--muted, #65758b); font-size: 1.125rem;
    }

    /* body */
    .about-body {
      max-width: 800px; margin: 0 auto;
      padding: 0 1.5rem;
      display: flex; flex-direction: column; gap: 1.25rem;
    }

    /* content card */
    .content-card {
      background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%);
      border: 1px solid var(--border, #c6cdd8);
      border-radius: var(--radius-lg, 1rem);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .card-title {
      font-size: 1.375rem; font-weight: 700;
      color: var(--foreground, #111e33); margin-bottom: 1rem;
      letter-spacing: -.02em;
    }
    .content-card p {
      font-size: .9375rem; color: var(--muted, #65758b);
      line-height: 1.8; margin-bottom: .875rem;
    }
    .content-card p:last-child { margin-bottom: 0; }
    .problem-bold { font-weight: 600; color: var(--foreground, #111e33) !important; }

    /* value grid */
    .value-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
    }
    .value-card {
      background: linear-gradient(180deg, #fff 0%, var(--bg, #f6f8fa) 100%);
      border: 1px solid var(--border, #c6cdd8);
      border-radius: var(--radius-lg, 1rem); padding: 1.5rem 1.25rem;
      box-shadow: var(--shadow-sm);
    }
    .value-icon-wrap {
      width: 48px; height: 48px; background: rgba(22,162,134,.1);
      border-radius: var(--radius, .75rem); display: flex; align-items: center;
      justify-content: center; margin-bottom: 1rem;
    }
    .value-icon { font-size: 1.375rem; }
    .value-card h3 {
      font-size: 1rem; font-weight: 600;
      color: var(--foreground, #111e33); margin-bottom: .5rem;
    }
    .value-card p {
      font-size: .875rem; color: var(--muted, #65758b); line-height: 1.65;
    }

    /* company card */
    .company-card { padding: 2rem; }
    .company-header {
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1rem;
    }
    .company-icon-wrap {
      width: 48px; height: 48px; background: rgba(22,162,134,.1);
      border-radius: var(--radius, .75rem); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .company-icon { font-size: 1.375rem; }
    .company-header h2 {
      font-size: 1.375rem; font-weight: 700; color: var(--foreground, #111e33); margin: 0;
      letter-spacing: -.02em;
    }
    .company-intro {
      font-size: .9375rem; color: var(--muted, #65758b); line-height: 1.7;
      margin-bottom: 1.25rem; padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--bg-2, #f1f4f7);
    }
    .company-details {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem 2rem;
    }
    .company-detail { display: flex; flex-direction: column; gap: .25rem; }
    .detail-label { font-size: .8125rem; color: var(--gray-400, #94a3b8); font-weight: 500; }
    .detail-value { font-size: .9375rem; color: var(--foreground, #111e33); font-weight: 600; }
    .detail-value a { color: var(--teal, #16a286); text-decoration: none; }
    .detail-value a:hover { text-decoration: underline; }

    @media (max-width: 640px) {
      .value-grid { grid-template-columns: 1fr; }
      .company-details { grid-template-columns: 1fr; }
      .content-card { padding: 1.25rem; }
      .about-heading h1 { font-size: 2rem; }
    }
  `]
})
export class AboutComponent {
  values = [
    {
      icon: '🎯',
      title: 'Our Mission',
      desc: 'Unlock the working capital trapped inside every confirmed purchase order in South Africa.'
    },
    {
      icon: '👥',
      title: 'Who We Serve',
      desc: 'SA suppliers with confirmed POs, and the private funders who back them.'
    },
    {
      icon: '🛡',
      title: 'Our Promise',
      desc: 'Direct, transparent connections. No middlemen, no hidden fees, no gatekeepers.'
    },
  ];
}
