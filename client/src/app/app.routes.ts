import { Routes } from '@angular/router';
import { Signup } from './pages/signup/signup';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Chat } from './pages/chat/chat';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'chat', component: Chat },
  { path: '', component: Home, pathMatch: 'full' },
];
