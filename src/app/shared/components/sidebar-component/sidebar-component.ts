import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { EmailService } from '../../../features/mailbox/services/email-service';
import { ToastService } from '../../../core/services/toast-service';
import { SidebarService } from '../../../core/services/sidebar-service';
import { Mailbox } from '../../../features/mailbox/models/mailbox.model';
import { CreateMailboxModalComponent } from '../../../features/mailbox/components/create-mailbox-modal/create-mailbox-modal';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CreateMailboxModalComponent, ConfirmModalComponent],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly emailService = inject(EmailService);
  private readonly toastService = inject(ToastService);
  public readonly sidebarService = inject(SidebarService);

  public readonly mailboxes: WritableSignal<Mailbox[]> = signal([]);
  public readonly loading = signal(false);
  public readonly creating = signal(false);
  public readonly showModal = signal(false);
  public readonly deletingId = signal<string | null>(null);
  public readonly confirmingDeleteId = signal<string | null>(null);

  public readonly asideClass = computed(() =>
    this.sidebarService.isOpen()
      ? 'fixed inset-0 z-50 flex flex-col bg-zinc-900'
      : 'hidden md:flex md:w-64 md:h-full md:shrink-0 md:flex-col md:border-r md:border-zinc-800 md:bg-zinc-900'
  );

  ngOnInit(): void {
    this.load();
  }

  openModal(): void {
    this.showModal.set(true);
  }

  onModalConfirmed(localPart: string): void {
    this.showModal.set(false);
    this.creating.set(true);
    this.emailService
      .createMailbox({ localPart })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: mailbox => {
          this.mailboxes.update(list => [mailbox, ...list]);
          this.toastService.success('Email criado com sucesso!');
        },
        error: () => this.toastService.error('Erro ao criar email.'),
      });
  }

  onModalCancelled(): void {
    this.showModal.set(false);
  }

  requestDelete(id: string): void {
    this.confirmingDeleteId.set(id);
  }

  onDeleteConfirmed(): void {
    const id = this.confirmingDeleteId();
    if (!id) return;
    this.confirmingDeleteId.set(null);
    this.deletingId.set(id);
    this.emailService
      .deleteMailbox(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.mailboxes.update(list => list.filter(m => m.id !== id));
          this.router.navigate(['/mailbox'])
          this.toastService.success('Mailbox deletada.');
        },
        error: () => this.toastService.error('Erro ao deletar mailbox.'),
      });
  }

  onDeleteCancelled(): void {
    this.confirmingDeleteId.set(null);
  }

  private load(): void {
    this.loading.set(true);
    this.emailService
      .getMailboxes()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: data => this.mailboxes.set(data),
        error: () => this.toastService.error('Erro ao carregar mailboxes.'),
      });
  }
}
