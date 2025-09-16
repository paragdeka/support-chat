import { Component, inject, OnInit, signal } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { AgentAuthService } from '../../services/agent-auth.service';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-support',
  imports: [Sidebar, CommonModule, Header],
  templateUrl: './support.html',
})
export class Support implements OnInit {
  isSidebarCollapsed = signal<boolean>(true);
  authService = inject(AgentAuthService);

  ngOnInit(): void {
    this.authService.checkAuthStatus();
  }

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }
}
