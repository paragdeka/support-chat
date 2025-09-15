import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentAuthService, CredentialsForm } from '../../services/agent-auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private agentAuthService = inject(AgentAuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.agentAuthService.login(this.loginForm.value as CredentialsForm).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => alert('Login failed: ' + err.message),
      });
    }
  }
}
