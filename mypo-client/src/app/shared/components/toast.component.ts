import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [ngClass]="'toast-' + t.type" (click)="toast.dismiss(t.id)">
          <i class="toast-icon" [class]="icon(t.type)"></i>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: .625rem; max-width: 360px; }
    .toast { display: flex; align-items: center; gap: .75rem; padding: .875rem 1rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); cursor: pointer; animation: slideIn .25s ease-out; font-size: .9rem; font-weight: 500; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-icon  { font-size: 1rem; flex-shrink: 0; }
    .toast-msg   { flex: 1; line-height: 1.4; }
    .toast-close { background: none; border: none; cursor: pointer; opacity: .6; font-size: .8rem; flex-shrink: 0; padding: 0; color: inherit; }
    .toast-close:hover { opacity: 1; }
    .toast-success { background: #0f172a; color: #fff; border-left: 4px solid #10b981; }
    .toast-error   { background: #0f172a; color: #fff; border-left: 4px solid #ef4444; }
    .toast-info    { background: #0f172a; color: #fff; border-left: 4px solid #3b82f6; }
    .toast-warning { background: #0f172a; color: #fff; border-left: 4px solid #f59e0b; }
  `]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
  icon(type: string) { return ({ success:'fas fa-check-circle', error:'fas fa-times-circle', info:'fas fa-info-circle', warning:'fas fa-exclamation-triangle' } as any)[type] || 'fas fa-info-circle'; }
}
