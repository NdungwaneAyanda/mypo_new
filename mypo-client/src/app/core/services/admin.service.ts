import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  totalUsers: number;
  totalApplications: number;
  totalFunders: number;
  pendingCount: number;
  reviewedCount: number;
  fundedCount: number;
  totalFundingRequested: number;
}

export interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  refCode: string | null;
  companyName: string | null;
  createdAt: string;
  applicationCount: number;
}

export interface AdminApplication {
  id: string;
  userId: string;
  refCode: string;
  companyName: string;
  email: string;
  industry: string;
  status: string;
  poAmount: number;
  amountNeeded: number;
  paymentTerms: string | null;
  assignedFunderCompany: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFunder {
  id: string;
  userId: string;
  refCode: string;
  companyName: string;
  email: string;
  fundingCapacity: string | null;
  isActive: boolean;
  claimedCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin`;

  getStats()        { return this.http.get<AdminStats>(`${this.base}/stats`); }
  getUsers()        { return this.http.get<AdminUser[]>(`${this.base}/users`); }
  getApplications() { return this.http.get<AdminApplication[]>(`${this.base}/applications`); }
  getFunders()      { return this.http.get<AdminFunder[]>(`${this.base}/funders`); }

  setUserRole(id: string, role: string, action: 'add' | 'remove') {
    return this.http.put(`${this.base}/users/${id}/role`, { role, action });
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.base}/users/${id}`);
  }

  setApplicationStatus(id: string, status: string) {
    return this.http.put(`${this.base}/applications/${id}/status`, { status });
  }

  deleteApplication(id: string) {
    return this.http.delete(`${this.base}/applications/${id}`);
  }

  setFunderActive(id: string, isActive: boolean) {
    return this.http.put(`${this.base}/funders/${id}/active`, { isActive });
  }
}
