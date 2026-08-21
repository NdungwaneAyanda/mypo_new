import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApplicationService } from '../../core/services/application.service';
import { AuthService } from '../../core/services/auth.service';
import { SignalRService } from '../../core/services/signalr.service';
import { ToastService } from '../../core/services/toast.service';
import { ApplicationDto, MessageDto, APPLICATION_DOC_TYPES, DocumentDto } from '../../core/models/application.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Page header -->
    <div class="dash-header">
      <div class="container">
        <div class="dash-header-inner">
          <div>
            <div class="dash-role-row">
              <span class="role-badge" [class.role-funder]="!isSupplier()">
                <i [class]="isSupplier() ? 'fa-solid fa-industry' : 'fa-solid fa-briefcase'"></i>
                {{ isSupplier() ? 'Supplier' : 'Funder' }}
              </span>
              @if (userEmail()) { <span class="dash-email">{{ userEmail() }}</span> }
            </div>
            <h1>{{ isSupplier() ? 'My Applications' : 'Funding Opportunities' }}</h1>
            <p>{{ isSupplier() ? 'Track and manage your PO funding applications' : 'Browse and claim available applications' }}</p>
          </div>
          <div class="dash-header-actions">
            @if (isSupplier()) {
              <a routerLink="/apply" class="btn btn-primary">+ New Application</a>
            }
          </div>
        </div>
      </div>
    </div>

    <div class="container" style="padding-top:2rem; padding-bottom:3rem">


      <!-- Stats row -->
      <div class="stats-row">
        @for (s of stats(); track s.label) {
          <div class="stat-card">
            <div class="stat-value" [style.color]="s.color">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input class="form-control search-box" placeholder="Search by company, ref code..." [(ngModel)]="searchQuery" />
        <div class="status-filters">
          @for (f of statusFilters; track f.value) {
            <button class="filter-chip" [class.active]="activeFilter() === f.value" (click)="activeFilter.set(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="skeletons">
          @for (sk of [1,2,3]; track sk) {
            <div class="skeleton-card">
              <div class="ske ske-title"></div>
              <div class="ske ske-sub"></div>
              <div class="ske ske-row"></div>
            </div>
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && pagedApps().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-folder-open"></i></div>
          <h3>{{ activeFilter() !== 'all' ? 'No matching applications' : isSupplier() ? 'No applications yet' : 'No opportunities available' }}</h3>
          <p>{{ isSupplier() ? 'Submit your first PO funding application to get started.' : 'New applications will appear here as suppliers submit them.' }}</p>
          @if (isSupplier()) { <a routerLink="/apply" class="btn btn-primary" style="margin-top:1rem">Apply for Funding</a> }
        </div>
      }

      <!-- App cards -->
      @for (app of pagedApps(); track app.id) {
        <div class="app-card" [class.expanded]="expandedId() === app.id">
          <div class="app-card-header" (click)="toggleExpand(app.id)">
            <div class="app-card-info">
              <div class="app-top-row">
                <strong class="app-company">{{ app.companyName }}</strong>
                <span class="badge" [ngClass]="statusClass(app.status)">{{ statusLabel(app.status) }}</span>
              </div>
              <div class="app-meta">
                <span><i class="fa-solid fa-building"></i> {{ app.industry || '—' }}</span>
                <span><i class="fa-solid fa-coins"></i> {{ formatAmount(app.poAmount) }}</span>
                <span><i class="fa-solid fa-file-lines"></i> Ref: {{ app.refCode || app.id.slice(0,8).toUpperCase() }}</span>
                @if (app.assignedFunderId) { <span class="funder-tag"><i class="fa-solid fa-user-check"></i> Funder assigned</span> }
              </div>
            </div>
            <div class="app-card-actions">
              @if (!isSupplier() && !app.assignedFunderId && isActiveFunder() && app.status === 'ready_for_funding') {
                <button class="btn btn-primary btn-sm" (click)="claim(app); $event.stopPropagation()">Claim</button>
              }
              @if (!isSupplier() && isMyClaimedApp(app) && (app.status === 'reviewed' || app.status === 'ready_for_funding')) {
                <button class="btn btn-dark btn-sm" (click)="takeOffer(app); $event.stopPropagation()"
                  [title]="'2% platform fee: ' + formatAmount(app.estimatedPlatformFee)">Take Offer</button>
              }
              <span class="expand-arrow">{{ expandedId() === app.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          @if (expandedId() === app.id) {
            <div class="app-card-body">
              <div class="detail-grid">
                <div class="detail-item"><span class="di-label">Contact</span><span>{{ app.contactName || '—' }}</span></div>
                <div class="detail-item"><span class="di-label">Email</span><span>{{ app.email || '—' }}</span></div>
                <div class="detail-item"><span class="di-label">Phone</span><span>{{ app.phone || '—' }}</span></div>
                <div class="detail-item"><span class="di-label">PO Amount</span><span>{{ formatAmount(app.poAmount) }}</span></div>
                <div class="detail-item"><span class="di-label">Cost of Delivery</span><span>{{ formatAmount(app.costOfDelivery) }}</span></div>
                <div class="detail-item"><span class="di-label">Amount Needed</span><span>{{ formatAmount(app.amountNeeded) }}</span></div>
                @if (!isSupplier()) {
                  <div class="detail-item">
                    <span class="di-label">Platform fee ({{ app.platformFeePercent }}%)</span>
                    <span>{{ formatAmount(app.platformFeeAmount ?? app.estimatedPlatformFee) }}{{ app.platformFeeAmount ? ' charged' : ' due on funding' }}</span>
                  </div>
                }
                <div class="detail-item"><span class="di-label">Payment Terms</span><span>{{ app.paymentTerms ? app.paymentTerms + ' days' : '—' }}</span></div>
                <div class="detail-item"><span class="di-label">Customer</span><span>{{ app.customerName || '—' }}</span></div>
                @if (app.description) { <div class="detail-item full"><span class="di-label">Description</span><span>{{ app.description }}</span></div> }
              </div>

              <div class="docs-section">
                  <h4>Documents ({{ uploadedCount(app) }}/{{ docSlots(app).length }})</h4>
                  @if (isSupplier() && app.status === 'provisional') {
                    <p class="docs-hint">Upload the Purchase Order to move this application to Ready for Funding.</p>
                  }
                  <div class="docs-list">
                    @for (slot of docSlots(app); track slot.type) {
                      <div class="doc-row" [class.missing]="!slot.doc">
                        <span class="doc-row-name">
                          <i [class]="slot.doc ? 'fa-solid fa-file-pdf' : 'fa-regular fa-file'"></i>
                          {{ slot.label }}
                          @if (slot.required) { <span class="doc-req">Required</span> }
                          @if (!slot.doc) { <span class="doc-missing">Outstanding</span> }
                        </span>
                        <div class="doc-row-actions">
                          @if (slot.doc) {
                            <button class="btn btn-ghost btn-sm" (click)="downloadDoc(app.id, slot.doc.id, slot.doc.fileName)">Download</button>
                            @if (isSupplier() && app.userId === auth.currentUser()?.id) {
                              <label class="btn btn-outline btn-sm replace-btn" [class.replacing]="replacingDocId() === slot.doc.id">
                                <input type="file" accept=".pdf,.doc,.docx" style="display:none"
                                  (change)="replaceDoc($event, app.id, slot.doc.id)" />
                                @if (replacingDocId() === slot.doc.id) {
                                  <i class="fas fa-spinner fa-spin"></i>
                                } @else {
                                  <i class="fas fa-retweet"></i> Replace
                                }
                              </label>
                            }
                          } @else if (isSupplier() && app.userId === auth.currentUser()?.id) {
                            <label class="btn btn-outline btn-sm replace-btn" [class.replacing]="uploadingDocType() === slot.type">
                              <input type="file" accept=".pdf,.doc,.docx" style="display:none"
                                (change)="uploadMissingDoc($event, app.id, slot.type)" />
                              @if (uploadingDocType() === slot.type) {
                                <i class="fas fa-spinner fa-spin"></i>
                              } @else {
                                <i class="fas fa-cloud-arrow-up"></i> Upload
                              }
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

              @if (canChat(app)) {
                <div class="chat-section">
                  <h4>Messages</h4>
                  <div class="chat-messages" #msgBox>
                    @if (messages().length === 0) {
                      <p class="chat-empty">No messages yet. Start the conversation.</p>
                    }
                    @for (msg of messages(); track msg.id) {
                      <div class="msg" [class.mine]="isMyMessage(msg)">
                        <div class="msg-bubble">{{ msg.messageText }}</div>
                        <div class="msg-time">{{ formatTime(msg.createdAt) }}</div>
                      </div>
                    }
                  </div>
                  <div class="chat-input-row">
                    <input class="form-control" [(ngModel)]="newMessage" placeholder="Type a message..." (keydown.enter)="sendMessage(app)" />
                    <button class="btn btn-primary btn-sm" (click)="sendMessage(app)" [disabled]="sendingMsg() || !newMessage.trim()">
                      @if (sendingMsg()) { <span class="spinner"></span> } @else { Send }
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="pg-btn" [disabled]="currentPage() === 1"     (click)="currentPage.set(currentPage()-1)">← Prev</button>
          @for (p of pageNumbers(); track p) {
            <button class="pg-btn" [class.active]="p === currentPage()" (click)="currentPage.set(p)">{{ p }}</button>
          }
          <button class="pg-btn" [disabled]="currentPage() === totalPages()" (click)="currentPage.set(currentPage()+1)">Next →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    /* header */
    .dash-header { background: linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%); color: #fff; padding: 2.5rem 1.5rem; }
    .dash-header-inner { display: flex; align-items: center; justify-content: space-between; max-width: 1160px; margin: 0 auto; gap: 1rem; flex-wrap: wrap; }
    .dash-header h1 { font-size: 1.75rem; font-weight: 800; margin-top: .5rem; }
    .dash-header p  { opacity: .7; margin-top: .25rem; font-size: .9375rem; }
    .dash-header-actions { display: flex; gap: .75rem; }
    .dash-role-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .125rem; }
    .role-badge {
      display: inline-flex; align-items: center; gap: .3rem;
      background: rgba(16,185,129,.2); color: #6ee7b7;
      border: 1px solid rgba(16,185,129,.35);
      padding: .25rem .75rem; border-radius: 9999px;
      font-size: .8rem; font-weight: 700; letter-spacing: .04em;
    }
    .role-badge.role-funder {
      background: rgba(124,58,237,.2); color: #c4b5fd;
      border-color: rgba(124,58,237,.35);
    }
    .dash-email { font-size: .8125rem; color: rgba(255,255,255,.5); }
    /* stats */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.125rem 1.25rem; box-shadow: var(--shadow-sm); }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: .8125rem; color: var(--gray-500); margin-top: .2rem; font-weight: 500; }
    /* filters */
    .filter-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .search-box { max-width: 280px; }
    .status-filters { display: flex; gap: .5rem; flex-wrap: wrap; }
    .filter-chip { padding: .375rem .875rem; border: 1.5px solid var(--gray-300); border-radius: 9999px; background: #fff; font-size: .8125rem; font-weight: 600; cursor: pointer; transition: all .2s; color: var(--gray-600); }
    .filter-chip.active { background: var(--navy); color: #fff; border-color: var(--navy); }
    /* skeleton */
    .skeletons { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.25rem; }
    .ske { background: var(--gray-200); border-radius: 4px; animation: pulse 1.4s ease-in-out infinite; }
    .ske-title { height: 18px; width: 40%; margin-bottom: .5rem; }
    .ske-sub   { height: 14px; width: 60%; margin-bottom: .75rem; }
    .ske-row   { height: 14px; width: 80%; }
    @keyframes pulse { 0%,100%{ opacity:1 } 50%{ opacity:.4 } }
    /* empty */
    .empty-state { text-align: center; padding: 4rem 2rem; background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); }
    .empty-icon  { font-size: 3rem; margin-bottom: .875rem; color: var(--gray-300); }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: var(--gray-800); margin-bottom: .5rem; }
    .empty-state p  { color: var(--gray-500); max-width: 380px; margin: 0 auto; font-size: .9375rem; }
    /* app card */
    .app-card { background: #fff; border: 1.5px solid var(--gray-200); border-radius: var(--radius-lg); margin-bottom: 1rem; transition: border-color .2s, box-shadow .2s; overflow: hidden; }
    .app-card.expanded { border-color: var(--teal); box-shadow: var(--shadow-md); }
    .app-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; cursor: pointer; gap: 1rem; }
    .app-card-header:hover { background: var(--gray-50); }
    .app-card-info { flex: 1; min-width: 0; }
    .app-top-row { display: flex; align-items: center; gap: .75rem; margin-bottom: .375rem; flex-wrap: wrap; }
    .app-company { font-size: 1rem; font-weight: 700; color: var(--gray-900); }
    .app-meta { display: flex; gap: 1.25rem; font-size: .8125rem; color: var(--gray-500); flex-wrap: wrap; }
    .funder-tag { color: var(--teal-dark); font-weight: 600; }
    .app-card-actions { display: flex; align-items: center; gap: .625rem; flex-shrink: 0; }
    .expand-arrow { font-size: .75rem; color: var(--gray-400); }
    /* expanded body */
    .app-card-body { padding: 0 1.25rem 1.25rem; border-top: 1px solid var(--gray-100); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; padding: 1rem 0; }
    .detail-item { display: flex; flex-direction: column; gap: .2rem; }
    .detail-item.full { grid-column: 1/-1; }
    .di-label { font-size: .75rem; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .04em; }
    .detail-item span:last-child { font-size: .9rem; color: var(--gray-700); }
    /* docs */
    .docs-section { margin-top: .75rem; border-top: 1px solid var(--gray-100); padding-top: .875rem; }
    .docs-section h4 { font-size: .875rem; font-weight: 700; color: var(--gray-700); margin-bottom: .5rem; }
    .docs-list { display: flex; flex-direction: column; gap: .375rem; }
    .doc-row { display: flex; align-items: center; justify-content: space-between; font-size: .875rem; padding: .375rem .625rem; background: var(--gray-50); border-radius: var(--radius-sm); gap: .5rem; }
    .doc-row.missing { background: #fff7ed; }
    .docs-hint { font-size: .8125rem; color: #c2410c; margin: 0 0 .5rem; }
    .doc-req, .doc-missing {
      font-size: .65rem; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;
      padding: .1rem .4rem; border-radius: 9999px; margin-left: .4rem;
    }
    .doc-req { background: rgba(16,185,129,.12); color: var(--teal-dark); }
    .doc-missing { background: #ffedd5; color: #c2410c; }
    .doc-row-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .doc-row-actions { display: flex; align-items: center; gap: .375rem; flex-shrink: 0; }
    .replace-btn { cursor: pointer; font-size: .75rem; padding: .25rem .6rem; border: 1.5px solid var(--gray-300); border-radius: var(--radius-sm); background: #fff; color: var(--gray-600); font-weight: 600; transition: all .2s; display: inline-flex; align-items: center; }
    .replace-btn:hover { border-color: var(--teal); color: var(--teal-dark); background: rgba(16,185,129,.04); }
    .replace-btn.replacing { opacity: .6; pointer-events: none; }
    /* chat */
    .chat-section { margin-top: .75rem; border-top: 1px solid var(--gray-100); padding-top: .875rem; }
    .chat-section h4 { font-size: .875rem; font-weight: 700; color: var(--gray-700); margin-bottom: .75rem; }
    .chat-messages { background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 1rem; min-height: 100px; max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: .625rem; margin-bottom: .75rem; }
    .chat-empty { color: var(--gray-400); text-align: center; font-size: .875rem; margin: auto 0; }
    .msg { display: flex; flex-direction: column; align-items: flex-start; }
    .msg.mine { align-items: flex-end; }
    .msg-bubble { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius); padding: .5rem .75rem; font-size: .875rem; max-width: 80%; }
    .msg.mine .msg-bubble { background: var(--navy); color: #fff; border-color: var(--navy); }
    .msg-time { font-size: .7rem; color: var(--gray-400); margin-top: .2rem; }
    .chat-input-row { display: flex; gap: .5rem; }
    .chat-input-row .form-control { flex: 1; }
    /* pagination */
    .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
    .pg-btn { padding: .4rem .75rem; border: 1.5px solid var(--gray-300); border-radius: var(--radius-sm); background: #fff; cursor: pointer; font-size: .8125rem; font-weight: 600; color: var(--gray-600); transition: all .2s; }
    .pg-btn.active { background: var(--navy); color: #fff; border-color: var(--navy); }
    .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
    .pg-btn:hover:not(:disabled):not(.active) { background: var(--gray-100); }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .filter-bar { flex-direction: column; align-items: stretch; } .search-box { max-width: 100%; } }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  applications  = signal<ApplicationDto[]>([]);
  loading       = signal(true);
  activeFilter  = signal('all');
  searchQuery   = '';
  expandedId    = signal<string|null>(null);
  messages      = signal<MessageDto[]>([]);
  newMessage    = '';
  sendingMsg    = signal(false);
  currentPage   = signal(1);
  replacingDocId = signal<string|null>(null);
  uploadingDocType = signal<string|null>(null);
  readonly PAGE_SIZE = 8;

  statusFilters = [
    { value:'all',               label:'All'               },
    { value:'provisional',       label:'Provisional'       },
    { value:'ready_for_funding', label:'Ready for Funding' },
    { value:'reviewed',          label:'Under Review'      },
    { value:'funded',            label:'Funded'            },
    { value:'declined',          label:'Declined'          },
  ];

  isSupplier     = computed(() => !!this.auth.currentUser()?.roles?.includes('supplier'));
  isActiveFunder = computed(() => !!this.auth.currentUser()?.roles?.includes('funder'));
  userEmail        = computed(() => this.auth.currentUser()?.email ?? '');

  filteredApps = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return this.applications().filter(a => {
      const matchStatus = this.activeFilter() === 'all' || a.status === this.activeFilter();
      const matchQ = !q || a.companyName.toLowerCase().includes(q) || (a.refCode||'').toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  });

  pagedApps = computed(() => {
    const s = (this.currentPage()-1)*this.PAGE_SIZE;
    return this.filteredApps().slice(s, s+this.PAGE_SIZE);
  });

  totalPages  = computed(() => Math.ceil(this.filteredApps().length / this.PAGE_SIZE));
  pageNumbers = computed(() => Array.from({length: this.totalPages()}, (_,i) => i+1));

  stats = computed(() => {
    const apps = this.applications();
    if (this.isSupplier()) return [
      { label:'Total Applications', value: apps.length, color: 'var(--navy)' },
      { label:'Provisional',        value: apps.filter(a=>a.status==='provisional').length,       color:'var(--warning)' },
      { label:'Ready for Funding',  value: apps.filter(a=>a.status==='ready_for_funding').length, color:'#3b82f6'        },
      { label:'Funded',             value: apps.filter(a=>a.status==='funded').length,            color:'var(--teal)'    },
    ];
    return [
      { label:'Available',  value: apps.filter(a=>a.status==='ready_for_funding' && !a.assignedFunderId).length, color:'var(--teal)'  },
      { label:'Claimed',    value: apps.filter(a=>a.status==='ready_for_funding' && !!a.assignedFunderId).length, color:'var(--navy)'  },
      { label:'Funded',     value: apps.filter(a=>a.status==='funded').length,            color:'#3b82f6'      },
      { label:'Total',      value: apps.length, color:'var(--gray-700)' },
    ];
  });

  constructor(
    private appSvc: ApplicationService, public auth: AuthService,
    private signalR: SignalRService, private toast: ToastService
  ) {}

  ngOnInit() { this.loadApps(); }

  loadApps() {
    this.loading.set(true);
    this.appSvc.getApplications().subscribe({
      next: apps => { this.applications.set(apps); this.loading.set(false); },
      error: ()  => { this.loading.set(false); this.toast.error('Failed to load applications.'); }
    });
  }

  private chatSub: any;

  toggleExpand(id: string) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.signalR.stopChat(id);
      this.chatSub?.unsubscribe();
      this.messages.set([]);
      return;
    }
    const prev = this.expandedId();
    if (prev) { this.signalR.stopChat(prev); this.chatSub?.unsubscribe(); }
    this.expandedId.set(id);
    this.messages.set([]);
    const app = this.applications().find(a => a.id === id);
    if (app && this.canChat(app)) {
      this.appSvc.getMessages(id).subscribe({ next: (msgs: MessageDto[]) => this.messages.set(msgs) });
      // Deduplicate: the sender's own message arrives via both the HTTP response and
      // the SignalR broadcast, so skip any message whose ID we already have.
      this.chatSub = this.signalR.messageReceived$.subscribe((msg: MessageDto) => {
        this.messages.update(current => {
          if (current.some(m => m.id === msg.id)) return current;
          return [...current, msg];
        });
      });
      this.signalR.startChat(id);
    }
  }

  canChat(app: ApplicationDto) {
    return app.status === 'funded' && app.assignedFunderId && (this.isSupplier() ? (app.userId === this.auth.currentUser()?.id) : this.isActiveFunder());
  }

  isMyMessage(msg: MessageDto) { return msg.senderId === this.auth.currentUser()?.id; }
  // assignedFunderUserId is the User.Id of the funder; compare that against the logged-in user's id
  isMyClaimedApp(app: ApplicationDto) { return app.assignedFunderUserId === this.auth.currentUser()?.id; }

  claim(app: ApplicationDto) {
    this.appSvc.claimApplication(app.id, 'claim').subscribe({
      next: () => { this.toast.success('Application claimed!'); this.loadApps(); },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to claim.')
    });
  }

  takeOffer(app: ApplicationDto) {
    const fee = app.platformFeeAmount ?? app.estimatedPlatformFee;
    const ok = confirm(
      `A ${app.platformFeePercent}% platform fee of ${this.formatAmount(fee)} will be charged to you on the amount needed (${this.formatAmount(app.amountNeeded)}).\n\nContinue and fund this application?`
    );
    if (!ok) return;
    this.appSvc.claimApplication(app.id, 'take').subscribe({
      next: () => { this.toast.success(`Funded. Platform fee ${this.formatAmount(fee)} recorded.`); this.loadApps(); },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed.')
    });
  }

  downloadDoc(appId: string, docId: string, fileName: string) {
    this.appSvc.downloadDocument(appId, docId).subscribe({
      next: (blob: Blob) => { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fileName; a.click(); },
      error: () => this.toast.error('Download failed.')
    });
  }

  replaceDoc(event: Event, appId: string, docId: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('File must be under 5MB.'); return; }
    this.replacingDocId.set(docId);
    this.appSvc.replaceDocument(appId, docId, file).subscribe({
      next: (updated: any) => {
        this.applications.update(apps => apps.map(a => {
          if (a.id !== appId) return a;
          return { ...a, documents: a.documents!.map(d => d.id === docId ? { ...d, fileName: updated.fileName, fileSize: updated.fileSize } : d) };
        }));
        this.replacingDocId.set(null);
        this.toast.success('Document replaced successfully.');
      },
      error: (err: any) => { this.replacingDocId.set(null); this.toast.error(err.error?.message || 'Replace failed.'); }
    });
  }

  uploadMissingDoc(event: Event, appId: string, documentType: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.toast.error('File must be under 5MB.'); return; }
    this.uploadingDocType.set(documentType);
    this.appSvc.uploadDocument(appId, file, documentType).subscribe({
      next: () => {
        this.uploadingDocType.set(null);
        this.toast.success(documentType === 'purchase_order'
          ? 'Purchase Order uploaded. Application is now Ready for Funding.'
          : 'Document uploaded.');
        this.loadApps();
      },
      error: (err: any) => {
        this.uploadingDocType.set(null);
        this.toast.error(err.error?.message || 'Upload failed.');
      }
    });
  }

  sendMessage(app: ApplicationDto) {
    if (!this.newMessage.trim()) return;
    this.sendingMsg.set(true);
    const text = this.newMessage.trim();
    this.newMessage = '';
    this.appSvc.sendMessage(app.id, text).subscribe({
      next: (saved: MessageDto) => {
        // Add own message immediately from HTTP response; the SignalR broadcast
        // will arrive shortly but the deduplication guard will skip the duplicate.
        this.messages.update(current => {
          if (current.some(m => m.id === saved.id)) return current;
          return [...current, saved];
        });
        this.sendingMsg.set(false);
      },
      error: () => {
        this.newMessage = text; // restore on failure
        this.sendingMsg.set(false);
        this.toast.error('Failed to send message.');
      }
    });
  }

  docSlots(app: ApplicationDto) {
    return APPLICATION_DOC_TYPES.map(slot => ({
      ...slot,
      doc: (app.documents || []).find(d => d.documentType === slot.type) as DocumentDto | undefined
    }));
  }

  uploadedCount(app: ApplicationDto) {
    return this.docSlots(app).filter(s => !!s.doc).length;
  }

  statusLabel(s: string) {
    return ({
      provisional: 'Provisional',
      ready_for_funding: 'Ready for Funding',
      reviewed: 'Under Review',
      funded: 'Funded',
      pending: 'Ready for Funding',
      successful: 'Funded',
      rejected: 'Rejected',
      declined: 'Declined'
    } as Record<string, string>)[s] || s;
  }

  statusClass(s: string) {
    const map: Record<string, string> = {
      pending: 'badge-ready_for_funding',
      successful: 'badge-funded'
    };
    return map[s] || `badge-${s}`;
  }
  formatAmount(n: number) { return n ? `R${n.toLocaleString('en-ZA')}` : '—'; }
  formatTime(d: string) { return new Date(d).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' }); }

  ngOnDestroy() { const id = this.expandedId(); if (id) this.signalR.stopChat(id); this.chatSub?.unsubscribe(); }
}
