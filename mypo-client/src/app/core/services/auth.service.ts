import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginDto, RegisterDto, UserDto } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY   = 'mypo_token';
  private readonly USER_KEY    = 'mypo_user';
  private readonly ROLE_KEY    = 'mypo_active_role';

  currentUser  = signal<UserDto | null>(this.loadUser());
  activeRole   = signal<string>(localStorage.getItem(this.ROLE_KEY) ?? '');

  constructor(private http: HttpClient, private router: Router) {}

  register(dto: RegisterDto) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, dto).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, dto).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  forgotPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  refreshMe() {
    return this.http.get<UserDto>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        const normalized = this.normalizeUser(user);
        this.currentUser.set(normalized);
        localStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
      })
    );
  }

  setActiveRole(role: string) {
    this.activeRole.set(role);
    localStorage.setItem(this.ROLE_KEY, role);
  }

  logout(redirectHome = true) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.currentUser.set(null);
    this.activeRole.set('');
    if (redirectHome) this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }

  isFunder(): boolean {
    return this.hasRole('funder');
  }

  isSupplier(): boolean {
    return this.hasRole('supplier');
  }

  /** Role chosen at sign-in — drives dashboard/header, not every role on the account. */
  actingAsFunder(): boolean {
    return this.activeRole() === 'funder';
  }

  actingAsSupplier(): boolean {
    return this.activeRole() === 'supplier';
  }

  handleAuth(res: AuthResponse | any) {
    const token = res?.token ?? res?.Token;
    const user = this.normalizeUser(res?.user ?? res?.User);
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private normalizeUser(raw: any): UserDto {
    const rolesRaw = raw?.roles ?? raw?.Roles ?? [];
    const roles = (Array.isArray(rolesRaw) ? rolesRaw : [])
      .map((r: string) => String(r).toLowerCase());
    return {
      id: raw?.id ?? raw?.Id,
      email: raw?.email ?? raw?.Email ?? '',
      roles,
      profile: raw?.profile ?? raw?.Profile
    };
  }

  private loadUser(): UserDto | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? this.normalizeUser(JSON.parse(stored)) : null;
    } catch {
      return null;
    }
  }
}
