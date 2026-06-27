import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';
import { SidebarService } from '../../../core/services/sidebar-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar-component.html',
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sidebarService = inject(SidebarService);

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
