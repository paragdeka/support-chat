import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AgentAuthService } from './services/agent-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AgentAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
