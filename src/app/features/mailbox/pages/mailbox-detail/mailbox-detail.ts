import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EmailService } from '../../services/email-service';
import { EmailMessage } from '../../models/email-message.model';
import { EmailDetails } from '../../models/email-details.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal';
import { ToastService } from '../../../../core/services/toast-service';
import { SignalRService } from '../../../../core/services/signalr-service';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-mailbox-detail',
  standalone: true,
  imports: [DatePipe, ConfirmModalComponent],
  templateUrl: './mailbox-detail.html',
})
export class MailboxDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly emailService = inject(EmailService);
  private readonly toastService = inject(ToastService);
  private readonly signalRService = inject(SignalRService);
  private readonly authService = inject(AuthService);

  readonly mailboxId = signal('');
  readonly address = signal('');
  readonly messages = signal<EmailMessage[]>([]);
  readonly loading = signal(false);
  readonly expandedId = signal<string | null>(null);
  readonly loadingDetails = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly confirmingDeleteId = signal<string | null>(null);
  readonly details = signal<Record<string, EmailDetails>>({});
  readonly connectionState = this.signalRService.state;

  constructor() {
    this.signalRService.connect(() => this.authService.token() ?? '');

    // Deduplicate by id in case REST and SignalR deliver the same message
    this.signalRService.newMessage$
      .pipe(takeUntilDestroyed())
      .subscribe(msg => {
        this.messages.update(list =>
          list.some(m => m.id === msg.id) ? list : [msg, ...list],
        );
      });

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const newId = params.get('id') ?? '';

      this.mailboxId.set(newId);
      this.address.set(history.state?.address ?? newId);
      this.reset();
      this.loadMessages(newId);
    });
  }

  refresh(): void {
    this.loadMessages(this.mailboxId());
  }

  back(): void {
    this.router.navigate(['/mailbox']);
  }

  toggle(msg: EmailMessage): void {
    if (this.expandedId() === msg.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(msg.id);
    if (!this.details()[msg.id]) {
      this.fetchDetails(msg.id);
      this.messages.update(prev => {
        const newMessages = [...prev];
        const idx = newMessages.findIndex(m => m.id === msg.id);
        newMessages[idx].isRead = true;
        return newMessages;
      });
    }
  }

  requestDeleteMessage(messageId: string): void {
    this.confirmingDeleteId.set(messageId);
  }

  onDeleteConfirmed(): void {
    const id = this.confirmingDeleteId();
    if (!id) return;
    this.confirmingDeleteId.set(null);
    this.deletingId.set(id);
    this.emailService
      .deleteMessage(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.removeMessage(id);
          this.toastService.success('Mensagem deletada.');
        },
        error: () => this.toastService.error('Erro ao deletar mensagem.'),
      });
  }

  onDeleteCancelled(): void {
    this.confirmingDeleteId.set(null);
  }

  unreadCount(): number {
    return this.messages().filter(m => !m.isRead).length;
  }

  private loadMessages(id: string): void {
    this.loading.set(true);
    this.emailService
      .getMessages(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: msgs => this.messages.set(msgs),
        error: () => this.toastService.error('Erro ao carregar mensagens.'),
      });
  }

  private fetchDetails(messageId: string): void {
    this.loadingDetails.set(messageId);
    this.emailService
      .getMessage(messageId)
      .pipe(finalize(() => this.loadingDetails.set(null)))
      .subscribe({
        next: d => this.details.update(map => ({ ...map, [messageId]: d })),
        error: () => this.toastService.error('Erro ao carregar mensagem.'),
      });
  }

  private reset(): void {
    this.messages.set([]);
    this.expandedId.set(null);
    this.details.set({});
  }

  private removeMessage(id: string): void {
    this.messages.update(list => list.filter(m => m.id !== id));
    if (this.expandedId() === id) {
      this.expandedId.set(null);
    }
  }
}
