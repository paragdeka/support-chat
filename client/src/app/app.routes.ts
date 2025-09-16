import { Routes } from '@angular/router';
import { Signup } from './pages/signup/signup';
import { Login } from './pages/login/login';
import { Chat } from './pages/chat/chat';
import { Support } from './pages/support/support';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'chat', component: Chat },
  {
    path: 'support',
    component: Support,
  },
  { path: '', redirectTo: 'support', pathMatch: 'full' },
];
