import { Component, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [MatTooltip, MatListModule, RouterLink, RouterLinkActive, MatIconModule, CommonModule],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  isCollapsed = input<boolean>();
  toggleClicked = output();

  navItems = [{ name: 'Tickets', route: '/support/tickets', icon: 'space_dashboard' }];
}
