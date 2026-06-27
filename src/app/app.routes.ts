import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing';
import { LoginComponent } from './features/auth/pages/login-component/login-component';
import { RegisterComponent } from './features/auth/pages/register-component/register-component';
import { ShellComponent } from './shared/components/shell/shell';
import { MailboxListComponent } from './features/mailbox/pages/mailbox-list/mailbox-list';
import { MailboxDetailComponent } from './features/mailbox/pages/mailbox-detail/mailbox-detail';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: 'mailbox',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: MailboxListComponent },
      { path: ':id', component: MailboxDetailComponent },
    ],
  },
];
