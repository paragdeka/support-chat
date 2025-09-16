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

export interface ProfileResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'admin';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AgentAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/agent`;
  isAuthenticated = signal<boolean>(false);

  readonly agentProfile = signal<AgentProfile | undefined>(undefined);

  checkAuthStatus() {
    this.http.get<ProfileResponse>(`${this.apiUrl}/me`).subscribe({
      next: (result) => {
        this.isAuthenticated.set(true);
        this.agentProfile.set({
          id: result._id,
          email: result.email,
          name: result.name,
          role: result.role as 'agent' | 'admin',
          createdAt: new Date(result.createdAt),
        });
      },
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
