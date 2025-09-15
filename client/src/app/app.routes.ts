import { Routes } from '@angular/router';
import { Signup } from './pages/signup/signup';
import { Home } from './pages/home/home';

export const routes: Routes = [
  { path: 'signup', component: Signup },
  { path: '', component: Home, pathMatch: 'full' },
];
