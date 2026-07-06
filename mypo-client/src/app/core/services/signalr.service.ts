import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private chatConnection?: signalR.HubConnection;
  private notifyConnection?: signalR.HubConnection;

  messageReceived$ = new Subject<any>();
  newOpportunity$ = new Subject<any>();

  constructor(private auth: AuthService) {}

  startChat(applicationId: string) {
    const token = this.auth.getToken();
    this.chatConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/chat?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    this.chatConnection.on('ReceiveMessage', msg => this.messageReceived$.next(msg));

    return this.chatConnection.start()
      .then(() => this.chatConnection!.invoke('JoinApplicationRoom', applicationId));
  }

  stopChat(applicationId: string) {
    if (this.chatConnection) {
      this.chatConnection.invoke('LeaveApplicationRoom', applicationId).catch(() => {});
      this.chatConnection.stop();
    }
  }

  startNotifications() {
    const token = this.auth.getToken();
    this.notifyConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/notifications?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    this.notifyConnection.on('NewOpportunity', data => this.newOpportunity$.next(data));

    return this.notifyConnection.start()
      .then(() => this.notifyConnection!.invoke('JoinFunderRoom'));
  }

  stopNotifications() {
    this.notifyConnection?.stop();
  }
}
