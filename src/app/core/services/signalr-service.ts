import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

import { ApiService } from './api-service';
import { EmailMessage } from '../../features/mailbox/models/email-message.model';

export type SignalRState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private readonly api = inject(ApiService);
  private hub: HubConnection | null = null;

  readonly newMessage$ = new Subject<EmailMessage>();
  readonly state = signal<SignalRState>('disconnected');

  async connect(tokenFactory: () => string): Promise<void> {
    if (this.hub?.state === HubConnectionState.Connected) return;

    this.hub = new HubConnectionBuilder()
      .withUrl(`${this.api.baseUrl}/hubs/notifications`, {
        accessTokenFactory: tokenFactory,
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .build();

    this.hub.on('newMessage', (message: EmailMessage) => {
      this.newMessage$.next(message);
    });

    this.hub.onreconnecting(() => this.state.set('reconnecting'));
    this.hub.onreconnected(() => this.state.set('connected'));
    this.hub.onclose(() => this.state.set('disconnected'));

    try {
      this.state.set('connecting');
      await this.hub.start();
      this.state.set('connected');
    } catch {
      this.state.set('disconnected');
    }
  }

  async disconnect(): Promise<void> {
    await this.hub?.stop();
    this.hub = null;
    this.state.set('disconnected');
  }
}