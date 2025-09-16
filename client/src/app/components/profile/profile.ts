import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgentAuthService } from '../../services/agent-auth.service';

@Component({
  selector: 'app-profile',
  imports: [MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.html',
})
export class Profile {
  authService = inject(AgentAuthService);
  profile = this.authService.agentProfile;

  logout() {
    this.authService.logout();
  }
}
