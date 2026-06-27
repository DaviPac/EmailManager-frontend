import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.html',
})
export class ConfirmModalComponent {
  title = input<string>('Confirmar');
  description = input<string>('Esta ação não pode ser desfeita.');
  confirmLabel = input<string>('Confirmar');
  loading = input<boolean>(false);

  confirmed = output<void>();
  cancelled = output<void>();
}
