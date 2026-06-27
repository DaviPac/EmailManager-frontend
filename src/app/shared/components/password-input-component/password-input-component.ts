import { Component, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
  selector: 'app-password-input',
  standalone: true,
  templateUrl: './password-input-component.html',
})
export class PasswordInputComponent implements ControlValueAccessor {

  label = input<string>('Senha');

  show = signal(false);
  value = '';
  protected readonly ngControl = inject(NgControl, { optional: true, self: true });

  private onChange = (value: string) => {};
  protected onTouched = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get showError(): boolean {
    const ctrl = this.ngControl?.control;
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get errorMessage(): string {
    const errors = this.ngControl?.control?.errors;
    if (!errors) return '';
    if (errors['required']) return 'Campo obrigatório';
    if (errors['minlength']) return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    if (errors['uppercase']) return 'Deve conter letra maiúscula';
    if (errors['lowercase']) return 'Deve conter letra minúscula';
    if (errors['number']) return 'Deve conter número';
    if (errors['special']) return 'Deve conter caractere especial (!@#$%...)';
    return 'Senha inválida';
  }

  toggle() {
    this.show.update(v => !v);
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  updateValue(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
}