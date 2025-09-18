import { Component, effect, inject, signal } from '@angular/core';
import { AgentSocketService, UnassignedTicketPayload } from '../../services/agent-socket.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-center',
  imports: [MatMenuModule, MatIconModule, CommonModule, TitleCasePipe],
  templateUrl: './notification-center.html',
})
export class NotificationCenter {
  agentSocketService = inject(AgentSocketService);
  newTicket = this.agentSocketService.unassignedTicket;
  notifications = signal<UnassignedTicketPayload[]>([]);
  notify = signal<boolean>(false);
  private router = inject(Router);

  private syncNotifications = effect(() => {
    if (this.newTicket()) {
      this.notifications.update((prev) => [...prev, this.newTicket()!]);
      this.notify.set(true);
    }
  });

  notificationSeen() {
    this.notify.set(false);
  }

  onNotificationClick(ticketId: string) {
    this.notifications.update((prev) => prev.filter((n) => n.id !== ticketId));
    this.router.navigate([`/support/ticket/${ticketId}`]);
  }
}
