import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApplicationDto, CreateApplicationDto, MessageDto } from '../models/application.models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private base = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  getApplications(asRole?: string) {
    const options = asRole ? { params: { asRole } } : {};
    return this.http.get<ApplicationDto[]>(this.base, options);
  }

  getApplication(id: string) {
    return this.http.get<ApplicationDto>(`${this.base}/${id}`);
  }

  createApplication(dto: CreateApplicationDto) {
    return this.http.post<ApplicationDto>(this.base, dto);
  }

  uploadDocument(applicationId: string, file: File, documentType: string) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(
      `${this.base}/${applicationId}/documents?documentType=${documentType}`,
      formData
    );
  }

  replaceDocument(applicationId: string, docId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<any>(
      `${this.base}/${applicationId}/documents/${docId}`,
      formData
    );
  }

  downloadDocument(applicationId: string, docId: string) {
    return this.http.get(
      `${this.base}/${applicationId}/documents/${docId}/download`,
      { responseType: 'blob' }
    );
  }

  claimApplication(id: string, action: 'claim' | 'take') {
    return this.http.put<ApplicationDto>(`${this.base}/${id}/claim`, { action });
  }

  getMessages(applicationId: string) {
    return this.http.get<MessageDto[]>(`${this.base}/${applicationId}/messages`);
  }

  sendMessage(applicationId: string, messageText: string) {
    return this.http.post<MessageDto>(`${this.base}/${applicationId}/messages`, { messageText });
  }
}
