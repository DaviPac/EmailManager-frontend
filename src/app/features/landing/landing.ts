import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
})
export class LandingComponent implements OnInit {
  private readonly router = inject(Router);
  readonly isAuthenticated = inject(AuthService).isAuthenticated;

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.router.navigate(['/mailbox']);
    }
  }
}
