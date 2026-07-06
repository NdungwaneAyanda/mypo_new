import { Component, Input } from '@angular/core';

let _id = 0;

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="logo-wrap" [class.stacked]="stacked" [class.light]="light">
      <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- main curve: lower-left sweeping to upper-right -->
        <path
          d="M8 40 C11 37 14 31 19 26 C23 22 27 17 33 11"
          [attr.stroke]="'url(#lg-' + uid + ')'"
          stroke-width="4.5"
          stroke-linecap="round"
          fill="none"/>
        <!-- arrowhead -->
        <path
          d="M27 8 L36 11 L33 20"
          [attr.stroke]="'url(#ag-' + uid + ')'"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"/>
        <defs>
          <linearGradient [attr.id]="'lg-' + uid" x1="8" y1="40" x2="33" y2="11" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="#06b6d4"/>
            <stop offset="55%"  stop-color="#10b981"/>
            <stop offset="100%" stop-color="#22c55e"/>
          </linearGradient>
          <linearGradient [attr.id]="'ag-' + uid" x1="27" y1="8" x2="33" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="#22c55e"/>
            <stop offset="100%" stop-color="#16a34a"/>
          </linearGradient>
        </defs>
      </svg>
      <span class="logo-text">MyPO</span>
    </div>
  `,
  styles: [`
    .logo-wrap {
      display: inline-flex; align-items: center; gap: .5rem;
      text-decoration: none;
    }
    .logo-wrap.stacked {
      flex-direction: column; gap: .25rem; align-items: center;
    }
    .logo-text {
      font-size: 1.25rem; font-weight: 800;
      color: #0d1b2e; letter-spacing: -.01em; line-height: 1;
    }
    .logo-wrap.light .logo-text { color: #fff; }
  `]
})
export class LogoComponent {
  @Input() size: number = 36;
  @Input() stacked = false;
  @Input() light   = false;
  uid = ++_id;
}
