import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { AgentAuthService } from '../../services/agent-auth.service';
import { Header } from '../../components/header/header';
import { RouterOutlet } from '@angular/router';
import { AgentSocketService } from '../../services/agent-socket.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-support',
  imports: [Sidebar, CommonModule, Header, RouterOutlet],
  templateUrl: './support.html',
})
export class Support implements OnInit {
  isSidebarCollapsed = signal<boolean>(true);
  private authService = inject(AgentAuthService);
  private agentSocketService = inject(AgentSocketService);

  private connectSocketIfAgentIdExists = effect(() => {
    const agentId = this.authService.agentProfile()?.id;
    if (agentId) {
      this.agentSocketService.connect(environment.baseUrl);
    }
  });

  ngOnInit(): void {
    this.authService.checkAuthStatus();
  }

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }
}
