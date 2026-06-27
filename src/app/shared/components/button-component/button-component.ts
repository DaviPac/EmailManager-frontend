import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button-component.html',
})
export class ButtonComponent {
  type = input<string>('button');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
}