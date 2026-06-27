import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { debounceTime, distinctUntilChanged, merge, of, switchMap, tap } from 'rxjs';

import { EmailService } from '../../services/email-service';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component';

@Component({
  selector: 'app-create-mailbox-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, ButtonComponent],
  templateUrl: './create-mailbox-modal.html',
})
export class CreateMailboxModalComponent implements OnInit {
  private readonly emailService = inject(EmailService);
  private readonly destroyRef = inject(DestroyRef);

  readonly creating = input<boolean>(false);
  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  readonly localPartControl = new FormControl(this.randomLocalPart(), {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[a-z0-9._-]+$/i)],
  });

  readonly verifying = signal(true);
  readonly available = signal<boolean | null>(null);

  get canConfirm(): boolean {
    return (
      this.localPartControl.valid &&
      this.available() === true &&
      !this.verifying() &&
      !this.creating()
    );
  }

  get borderClass(): string {
    const hasError = this.localPartControl.touched && this.localPartControl.invalid;
    return hasError
      ? 'border-red-400'
      : 'border-slate-300 focus-within:border-blue-500';
  }

  ngOnInit(): void {
    merge(
      of(this.localPartControl.value),
      this.localPartControl.valueChanges.pipe(debounceTime(500)),
    ).pipe(
      distinctUntilChanged(),
      tap(v => {
        this.available.set(null);
        this.verifying.set(!!v && this.localPartControl.valid);
      }),
      switchMap(v =>
        v && this.localPartControl.valid
          ? this.emailService.verifyMailbox(v.trim().toLowerCase())
          : of(null),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      this.verifying.set(false);
      this.available.set(result);
    });
  }

  confirm(): void {
    if (this.canConfirm) {
      this.confirmed.emit(this.localPartControl.value.trim().toLowerCase());
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private randomLocalPart(): string {
    return crypto.randomUUID().split('-')[0];
  }
}
