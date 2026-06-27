import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth-service';
import { strongPasswordValidator } from '../../validators/password-validator';
import { ButtonComponent } from '../../../../shared/components/button-component/button-component';
import { CardComponent } from '../../../../shared/components/card-component/card-component';
import { InputComponent } from '../../../../shared/components/input-component/input-component';
import { PasswordInputComponent } from '../../../../shared/components/password-input-component/password-input-component';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    InputComponent,
    PasswordInputComponent,
  ],
  templateUrl: './register-component.html',
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.authService
      .register({ email, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/mailbox']),
        error: err => {
          if (err.status === 409) {
            this.error.set('Este e-mail já está em uso.');
            return;
          }
          this.error.set('Erro ao criar conta. Tente novamente.');
        },
      });
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') &&
      (this.form.get('confirmPassword')?.touched ?? false);
  }
}
