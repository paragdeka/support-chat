import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export interface CredentialsForm {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/agent`;
  isAuthenticated = signal<boolean>(false);

  checkAuthStatus() {
    this.http.get(`${this.apiUrl}/me`).subscribe({
      next: () => this.isAuthenticated.set(true),
      error: () => this.isAuthenticated.set(false),
    });
  }

  signup(agent: SignupForm) {
    return this.http.post(`${this.apiUrl}/signup`, agent).pipe(tap(() => this.checkAuthStatus()));
  }

  login(credentials: CredentialsForm) {
    return this.http
      .post(`${this.apiUrl}/login`, credentials)
      .pipe(tap(() => this.checkAuthStatus()));
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe(() => {
      this.isAuthenticated.set(false);
      this.router.navigate(['/login']);
    });
  }
}
