import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api-service';
import { Mailbox } from '../models/mailbox.model';
import { CreateMailboxRequest } from '../dto/create-mailbox-request';
import { catchError, delay, map, Observable, of, throwError } from 'rxjs';
import { EmailMessage } from '../models/email-message.model';
import { EmailDetails } from '../models/email-details.model';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private api = inject(ApiService);

  public getMailboxes(): Observable<Mailbox[]> {
    return this.api.get<Mailbox[]>('/mailboxes');
  }

  public createMailbox(request: CreateMailboxRequest): Observable<Mailbox> {
    return this.api.post<Mailbox>('/mailboxes', request);
  }

  public verifyMailbox(localPart: string): Observable<boolean> {
    return this.api.head(`/mailboxes/check-address?address=${localPart}`)
      .pipe(
        map(() => false), 
        catchError((error) => {
          if (error.status === 404) {
            return of(true); 
          }
          throw error; 
        })
      );
  }

  public deleteMailbox(mailboxId: string): Observable<void> {
    return this.api.delete(`/mailboxes/${mailboxId}`);
  }

  public getMessages(mailboxId: string): Observable<EmailMessage[]> {
    return this.api.get<EmailMessage[]>(`/mailboxes/${mailboxId}/messages`);
  }

  public getMessage(messageId: string): Observable<EmailDetails> {
    return this.api.get<EmailDetails>(`/messages/${messageId}`);
  }

  public deleteMessage(messageId: string): Observable<void> {
    return this.api.delete(`/messages/${messageId}`);
  }
}
