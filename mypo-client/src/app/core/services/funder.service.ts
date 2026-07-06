import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FunderDto, RegisterFunderDto } from '../models/application.models';
import { AuthResponse } from '../models/auth.models';

export interface FunderSignupDto {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  phone: string;
  companyWebsite?: string;
  yearsInBusiness?: number;
  fundingCapacity?: string;
  fundingDescription?: string;
  industries: string[];
  minPoAmount?: number;
  maxPoAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class FunderService {
  private base = `${environment.apiUrl}/funders`;

  constructor(private http: HttpClient) {}

  /** Public signup — creates a brand-new funder account + logs in */
  signupFunder(dto: FunderSignupDto) {
    return this.http.post<AuthResponse>(`${this.base}/signup`, dto);
  }

  /** Legacy: add funder role to an already logged-in account */
  registerFunder(dto: RegisterFunderDto) {
    return this.http.post<FunderDto>(`${this.base}/register`, dto);
  }

  getMyProfile() {
    return this.http.get<FunderDto>(`${this.base}/me`);
  }
}
