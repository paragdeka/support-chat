import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgentAuthService, type SignupForm } from '../../services/agent-auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './signup.html',
})
export class Signup {
  private fb = inject(FormBuilder);
  private agentAuthService = inject(AgentAuthService);
  private router = inject(Router);

  signupForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.signupForm.valid) {
      this.agentAuthService.signup(this.signupForm.value as SignupForm).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => alert('Signup failed: ' + err.message),
      });
    }
  }
}
