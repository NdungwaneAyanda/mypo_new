import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminStats,
  AdminUser,
  AdminApplication,
  AdminFunder
} from '../../core/services/admin.service';

type Tab = 'overview' | 'users' | 'applications' | 'funders';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-icon"><i class="fas fa-shield-alt"></i></span>
          <span class="brand-name">Admin Panel</span>
        </div>
        <nav class="s-nav">
          <button class="s-link" [class.active]="tab() === 'overview'"      (click)="setTab('overview')">
            <i class="fas fa-chart-pie"></i> Overview
          </button>
          <button class="s-link" [class.active]="tab() === 'users'"         (click)="setTab('users')">
            <i class="fas fa-users"></i> Users
          </button>
          <button class="s-link" [class.active]="tab() === 'applications'"  (click)="setTab('applications')">
            <i class="fas fa-file-alt"></i> Applications
          </button>
          <button class="s-link" [class.active]="tab() === 'funders'"       (click)="setTab('funders')">
            <i class="fas fa-hand-holding-usd"></i> Funders
          </button>
        </nav>
        <a href="/dashboard" class="s-back"><i class="fas fa-arrow-left"></i> Back to App</a>
      </aside>

      <!-- Main content -->
      <main class="main-content">

        <!-- ── Overview ─────────────────────────────────────────────────────── -->
        @if (tab() === 'overview') {
          <section>
            <h1 class="pg-title">Overview</h1>
            @if (stats()) {
              <div class="stats-grid">
                <div class="stat-card teal">
                  <div class="stat-icon"><i class="fas fa-users"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">{{ stats()!.totalUsers }}</div>
                    <div class="stat-lbl">Total Users</div>
                  </div>
                </div>
                <div class="stat-card navy">
                  <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">{{ stats()!.totalApplications }}</div>
                    <div class="stat-lbl">Applications</div>
                  </div>
                </div>
                <div class="stat-card indigo">
                  <div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">{{ stats()!.totalFunders }}</div>
                    <div class="stat-lbl">Funders</div>
                  </div>
                </div>
                <div class="stat-card green">
                  <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">{{ stats()!.fundedCount }}</div>
                    <div class="stat-lbl">Funded Deals</div>
                  </div>
                </div>
                <div class="stat-card amber">
                  <div class="stat-icon"><i class="fas fa-clock"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">{{ stats()!.pendingCount }}</div>
                    <div class="stat-lbl">Open</div>
                  </div>
                </div>
                <div class="stat-card blue">
                  <div class="stat-icon"><i class="fas fa-search-dollar"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">R {{ (stats()!.totalFundingRequested / 1000).toFixed(0) }}K</div>
                    <div class="stat-lbl">Total Requested</div>
                  </div>
                </div>
                <div class="stat-card green">
                  <div class="stat-icon"><i class="fas fa-percent"></i></div>
                  <div class="stat-body">
                    <div class="stat-val">R {{ (stats()!.totalPlatformFees / 1000).toFixed(1) }}K</div>
                    <div class="stat-lbl">Platform fees (2%)</div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading stats…</div>
            }
          </section>
        }

        <!-- ── Users ─────────────────────────────────────────────────────────── -->
        @if (tab() === 'users') {
          <section>
            <h1 class="pg-title">Users <span class="badge">{{ users().length }}</span></h1>
            @if (usersLoading()) {
              <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Roles</th>
                      <th>Applications</th>
                      <th>Joined</th>
                      <th class="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of users(); track u.id) {
                      <tr>
                        <td>{{ u.email }}</td>
                        <td>{{ u.companyName || '—' }}</td>
                        <td>
                          @for (r of u.roles; track r) {
                            <span class="role-chip" [class]="'role-' + r">{{ r }}</span>
                          }
                        </td>
                        <td class="center">{{ u.applicationCount }}</td>
                        <td class="muted">{{ u.createdAt | date:'mediumDate' }}</td>
                        <td class="actions-col">
                          @if (!u.roles.includes('admin')) {
                            <button class="btn btn-xs btn-primary" (click)="promoteAdmin(u)" title="Make Admin">
                              <i class="fas fa-user-shield"></i> Admin
                            </button>
                          } @else {
                            <button class="btn btn-xs btn-outline" (click)="removeAdmin(u)" title="Remove Admin">
                              <i class="fas fa-user-minus"></i> Un-admin
                            </button>
                          }
                          @if (!u.roles.includes('supplier') && !u.roles.includes('funder')) {
                            <button class="btn btn-xs btn-outline" (click)="addRole(u, 'supplier')" title="Add Supplier role">
                              <i class="fas fa-plus"></i> Supplier
                            </button>
                          }
                          <button class="btn btn-xs btn-danger" (click)="deleteUser(u)" title="Delete user">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        <!-- ── Applications ─────────────────────────────────────────────────── -->
        @if (tab() === 'applications') {
          <section>
            <h1 class="pg-title">Applications <span class="badge">{{ applications().length }}</span></h1>
            <div class="filter-row">
              <select [(ngModel)]="appFilter" class="filter-select">
                <option value="">All statuses</option>
                <option value="provisional">Provisional</option>
                <option value="ready_for_funding">Ready for Funding</option>
                <option value="reviewed">Under Review</option>
                <option value="funded">Funded</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            @if (appsLoading()) {
              <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Company</th>
                      <th>Industry</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Status</th>
                      <th>Funder</th>
                      <th>Docs</th>
                      <th>Submitted</th>
                      <th class="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (a of filteredApps(); track a.id) {
                      <tr>
                        <td class="mono">{{ a.refCode }}</td>
                        <td>{{ a.companyName }}</td>
                        <td class="muted">{{ a.industry }}</td>
                        <td class="mono">R {{ a.amountNeeded | number }}</td>
                        <td class="mono">@if (a.platformFeeAmount != null) { R {{ a.platformFeeAmount | number:'1.2-2' }} } @else { — }</td>
                        <td>
                          <select class="status-select" [ngModel]="a.status"
                                  (ngModelChange)="setAppStatus(a, $event)">
                            <option value="provisional">Provisional</option>
                            <option value="ready_for_funding">Ready for Funding</option>
                            <option value="reviewed">Under Review</option>
                            <option value="funded">Funded</option>
                            <option value="declined">Declined</option>
                          </select>
                        </td>
                        <td class="muted">{{ a.assignedFunderCompany || '—' }}</td>
                        <td class="center">{{ a.documentCount }}</td>
                        <td class="muted">{{ a.createdAt | date:'mediumDate' }}</td>
                        <td class="actions-col">
                          <button class="btn btn-xs btn-danger" (click)="deleteApplication(a)">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        <!-- ── Funders ───────────────────────────────────────────────────────── -->
        @if (tab() === 'funders') {
          <section>
            <h1 class="pg-title">Funders <span class="badge">{{ funders().length }}</span></h1>
            @if (fundersLoading()) {
              <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Capacity</th>
                      <th>Claimed</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th class="actions-col">Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (f of funders(); track f.id) {
                      <tr [class.row-inactive]="!f.isActive">
                        <td class="mono">{{ f.refCode }}</td>
                        <td>{{ f.companyName }}</td>
                        <td class="muted">{{ f.email }}</td>
                        <td class="muted">{{ f.fundingCapacity || '—' }}</td>
                        <td class="center">{{ f.claimedCount }}</td>
                        <td>
                          <span class="status-chip" [class.active]="f.isActive" [class.inactive]="!f.isActive">
                            {{ f.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td class="muted">{{ f.createdAt | date:'mediumDate' }}</td>
                        <td class="actions-col">
                          <button class="btn btn-xs" [class]="f.isActive ? 'btn-warning' : 'btn-success'"
                                  (click)="toggleFunder(f)">
                            <i class="fas" [class]="f.isActive ? 'fa-ban' : 'fa-check'"></i>
                            {{ f.isActive ? 'Deactivate' : 'Activate' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        <!-- Toast -->
        @if (toast()) {
          <div class="toast" [class.toast-err]="toastErr()">{{ toast() }}</div>
        }

      </main>
    </div>
  `,
  styles: [`
    :host { display: contents; }

    /* ── Shell ── */
    .admin-shell {
      display: flex; min-height: 100vh; background: #f4f6f9; font-family: inherit;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 230px; flex-shrink: 0; background: #111e33; color: #fff;
      display: flex; flex-direction: column; padding: 1.5rem 1rem;
      position: sticky; top: 0; height: 100vh; overflow-y: auto;
    }
    .brand {
      display: flex; align-items: center; gap: .625rem;
      font-size: 1.125rem; font-weight: 700; margin-bottom: 2rem;
      padding: .5rem .5rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .brand-icon { color: #16a286; font-size: 1.25rem; }
    .s-nav { display: flex; flex-direction: column; gap: .25rem; flex: 1; }
    .s-link {
      display: flex; align-items: center; gap: .75rem; padding: .625rem .875rem;
      border-radius: .5rem; font-size: .9rem; font-weight: 500; color: rgba(255,255,255,.65);
      background: none; border: none; cursor: pointer; text-align: left; transition: all .15s;
    }
    .s-link:hover { background: rgba(255,255,255,.08); color: #fff; }
    .s-link.active { background: rgba(22,162,134,.2); color: #1ec9a8; }
    .s-back {
      display: flex; align-items: center; gap: .5rem; padding: .625rem .875rem;
      border-radius: .5rem; font-size: .875rem; color: rgba(255,255,255,.45);
      text-decoration: none; transition: color .15s; margin-top: 1rem;
    }
    .s-back:hover { color: #fff; }

    /* ── Main ── */
    .main-content { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; }
    .pg-title {
      font-size: 1.625rem; font-weight: 700; color: #111e33;
      margin: 0 0 1.5rem; display: flex; align-items: center; gap: .75rem;
    }
    .badge {
      background: #e8edf3; color: #65758b; font-size: .75rem;
      padding: .125rem .5rem; border-radius: 100px; font-weight: 600;
    }

    /* ── Stats grid ── */
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;
    }
    .stat-card {
      background: #fff; border-radius: 1rem; padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.07);
      border-left: 4px solid transparent;
    }
    .stat-card.teal   { border-color: #16a286; }
    .stat-card.navy   { border-color: #111e33; }
    .stat-card.indigo { border-color: #6366f1; }
    .stat-card.green  { border-color: #22c55e; }
    .stat-card.amber  { border-color: #f59e0b; }
    .stat-card.blue   { border-color: #3b82f6; }
    .stat-icon { font-size: 1.5rem; opacity: .7; }
    .teal   .stat-icon { color: #16a286; }
    .navy   .stat-icon { color: #111e33; }
    .indigo .stat-icon { color: #6366f1; }
    .green  .stat-icon { color: #22c55e; }
    .amber  .stat-icon { color: #f59e0b; }
    .blue   .stat-icon { color: #3b82f6; }
    .stat-val { font-size: 1.75rem; font-weight: 700; color: #111e33; line-height: 1; }
    .stat-lbl { font-size: .8rem; color: #65758b; margin-top: .25rem; font-weight: 500; }

    /* ── Tables ── */
    .filter-row { margin-bottom: 1rem; }
    .filter-select {
      padding: .4rem .75rem; border: 1px solid #d1d9e0; border-radius: .5rem;
      font-size: .875rem; background: #fff; color: #111e33;
    }
    .table-wrap { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse; background: #fff;
      border-radius: 1rem; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.07);
      font-size: .875rem;
    }
    .data-table th {
      background: #f8fafc; color: #65758b; font-size: .75rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
      padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #e8edf3;
    }
    .data-table td {
      padding: .75rem 1rem; border-bottom: 1px solid #f1f4f7;
      vertical-align: middle; color: #111e33;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .data-table tr.row-inactive td { opacity: .6; }
    .actions-col { white-space: nowrap; text-align: right; }
    .center { text-align: center; }
    .muted  { color: #65758b; }
    .mono   { font-family: monospace; font-size: .85rem; }

    /* ── Role chips ── */
    .role-chip {
      display: inline-block; padding: .125rem .5rem; border-radius: 100px;
      font-size: .7rem; font-weight: 600; text-transform: uppercase;
      margin: .1rem .15rem; letter-spacing: .04em;
    }
    .role-admin    { background: #fee2e2; color: #b91c1c; }
    .role-supplier { background: #dbeafe; color: #1d4ed8; }
    .role-funder   { background: #d1fae5; color: #065f46; }

    /* ── Status chips ── */
    .status-chip {
      display: inline-block; padding: .2rem .6rem; border-radius: 100px;
      font-size: .75rem; font-weight: 600;
    }
    .status-chip.active   { background: #d1fae5; color: #065f46; }
    .status-chip.inactive { background: #fee2e2; color: #b91c1c; }

    /* ── Status select ── */
    .status-select {
      padding: .25rem .5rem; border: 1px solid #d1d9e0; border-radius: .375rem;
      font-size: .8rem; background: #fff; cursor: pointer;
    }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .35rem .75rem; border-radius: .5rem; font-size: .8rem;
      font-weight: 600; cursor: pointer; border: none; transition: all .15s;
    }
    .btn-xs { padding: .25rem .55rem; font-size: .75rem; border-radius: .375rem; }
    .btn-primary  { background: #111e33; color: #fff; }
    .btn-primary:hover  { background: #1b294b; }
    .btn-outline  { background: transparent; color: #111e33; border: 1px solid #d1d9e0; }
    .btn-outline:hover  { background: #f1f4f7; }
    .btn-danger   { background: #ef4444; color: #fff; }
    .btn-danger:hover   { background: #dc2626; }
    .btn-warning  { background: #f59e0b; color: #fff; }
    .btn-warning:hover  { background: #d97706; }
    .btn-success  { background: #22c55e; color: #fff; }
    .btn-success:hover  { background: #16a34a; }

    /* ── Loading ── */
    .loading { padding: 3rem; text-align: center; color: #65758b; font-size: 1rem; }

    /* ── Toast ── */
    .toast {
      position: fixed; bottom: 2rem; right: 2rem;
      background: #111e33; color: #fff;
      padding: .75rem 1.25rem; border-radius: .75rem;
      font-size: .9rem; font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,.2);
      animation: slide-up .2s ease-out;
      z-index: 9999;
    }
    .toast.toast-err { background: #ef4444; }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .sidebar { width: 60px; }
      .brand-name, .s-link span, .s-back span { display: none; }
      .main-content { padding: 1rem; }
    }
  `]
})
export class AdminComponent implements OnInit {
  tab = signal<Tab>('overview');

  stats        = signal<AdminStats | null>(null);
  users        = signal<AdminUser[]>([]);
  applications = signal<AdminApplication[]>([]);
  funders      = signal<AdminFunder[]>([]);

  usersLoading   = signal(false);
  appsLoading    = signal(false);
  fundersLoading = signal(false);

  appFilter = '';

  toast    = signal<string | null>(null);
  toastErr = signal(false);

  constructor(private adminSvc: AdminService) {}

  ngOnInit() {
    this.loadStats();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'overview' && !this.stats())     this.loadStats();
    if (t === 'users'    && !this.users().length) this.loadUsers();
    if (t === 'applications' && !this.applications().length) this.loadApps();
    if (t === 'funders'  && !this.funders().length) this.loadFunders();
  }

  loadStats() {
    this.adminSvc.getStats().subscribe({
      next: s  => this.stats.set(s),
      error: () => this.showToast('Failed to load stats', true)
    });
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.adminSvc.getUsers().subscribe({
      next:  u  => { this.users.set(u); this.usersLoading.set(false); },
      error: () => { this.usersLoading.set(false); this.showToast('Failed to load users', true); }
    });
  }

  loadApps() {
    this.appsLoading.set(true);
    this.adminSvc.getApplications().subscribe({
      next:  a  => { this.applications.set(a); this.appsLoading.set(false); },
      error: () => { this.appsLoading.set(false); this.showToast('Failed to load applications', true); }
    });
  }

  loadFunders() {
    this.fundersLoading.set(true);
    this.adminSvc.getFunders().subscribe({
      next:  f  => { this.funders.set(f); this.fundersLoading.set(false); },
      error: () => { this.fundersLoading.set(false); this.showToast('Failed to load funders', true); }
    });
  }

  filteredApps() {
    return this.appFilter
      ? this.applications().filter(a => a.status === this.appFilter)
      : this.applications();
  }

  // ── User actions ──

  promoteAdmin(u: AdminUser) {
    this.adminSvc.setUserRole(u.id, 'admin', 'add').subscribe({
      next: () => {
        u.roles = [...u.roles, 'admin'];
        this.users.set([...this.users()]);
        this.showToast(`${u.email} is now an admin`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  removeAdmin(u: AdminUser) {
    if (!confirm(`Remove admin role from ${u.email}?`)) return;
    this.adminSvc.setUserRole(u.id, 'admin', 'remove').subscribe({
      next: () => {
        u.roles = u.roles.filter(r => r !== 'admin');
        this.users.set([...this.users()]);
        this.showToast(`Admin role removed from ${u.email}`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  addRole(u: AdminUser, role: string) {
    this.adminSvc.setUserRole(u.id, role, 'add').subscribe({
      next: () => {
        u.roles = [...u.roles, role];
        this.users.set([...this.users()]);
        this.showToast(`Role '${role}' added to ${u.email}`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  deleteUser(u: AdminUser) {
    if (!confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
    this.adminSvc.deleteUser(u.id).subscribe({
      next: () => {
        this.users.set(this.users().filter(x => x.id !== u.id));
        this.showToast(`User ${u.email} deleted`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  // ── Application actions ──

  setAppStatus(a: AdminApplication, status: string) {
    this.adminSvc.setApplicationStatus(a.id, status).subscribe({
      next: () => {
        a.status = status;
        this.applications.set([...this.applications()]);
        this.showToast(`Status updated to '${status}'`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  deleteApplication(a: AdminApplication) {
    if (!confirm(`Delete application ${a.refCode}? This cannot be undone.`)) return;
    this.adminSvc.deleteApplication(a.id).subscribe({
      next: () => {
        this.applications.set(this.applications().filter(x => x.id !== a.id));
        this.showToast(`Application ${a.refCode} deleted`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  // ── Funder actions ──

  toggleFunder(f: AdminFunder) {
    this.adminSvc.setFunderActive(f.id, !f.isActive).subscribe({
      next: () => {
        f.isActive = !f.isActive;
        this.funders.set([...this.funders()]);
        this.showToast(`${f.companyName} ${f.isActive ? 'activated' : 'deactivated'}`);
      },
      error: (e) => this.showToast(e.error?.message || 'Failed', true)
    });
  }

  // ── Helpers ──

  private toastTimer: any;
  showToast(msg: string, err = false) {
    this.toast.set(msg);
    this.toastErr.set(err);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }
}
