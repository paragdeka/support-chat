import { Component, signal } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  imports: [Sidebar, CommonModule],
  templateUrl: './support.html',
})
export class Support {
  isSidebarCollapsed = signal<boolean>(true);

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }
}
