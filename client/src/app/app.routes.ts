import { Routes } from '@angular/router';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { Chat } from './pages/chat/chat';
import { Support } from './pages/support/support';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'chat', component: Chat },
  {
    path: 'support',
    component: Support,
    canActivate: [authGuard],
    children: [
      {
        path: 'tickets',
        loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'ticket/:id',
        loadComponent: () =>
          import('./components/ticket-detail/ticket-detail').then((m) => m.TicketDetail),
      },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'support/tickets', pathMatch: 'full' },
];
