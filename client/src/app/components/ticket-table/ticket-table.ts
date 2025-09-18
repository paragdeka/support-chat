import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { TicketRow, TicketService } from '../../services/ticket.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AgentSocketService, UnassignedTicketPayload } from '../../services/agent-socket.service';
import { formatRelativeDate } from '../../utils';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ticket-table',
  imports: [TitleCasePipe, CommonModule, MatProgressSpinnerModule],
  templateUrl: './ticket-table.html',
})
export class TicketTable implements OnInit {
  private ticketService = inject(TicketService);
  private agentSocketService = inject(AgentSocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tickets = this.ticketService.tickets;
  ticketsFetching = this.ticketService.isFetching;

  newTicket = this.agentSocketService.unassignedTicket;
  notification = signal<boolean>(false);

  private mapNewTicket(newT: UnassignedTicketPayload): TicketRow {
    return {
      id: newT.id,
      createdAt: formatRelativeDate(newT.createdAt),
      customerName: newT.customerName,
      issue: newT.subject,
      priority: newT.priority,
      status: newT.status,
    };
  }

  private syncNewTicketsFromSocket = effect(() => {
    const t = this.newTicket();
    // add it to the current table if 'open' filter is used or no filter
    if (t) {
      if (this.activeFilters['status'] === 'open' || !this.activeFilters['status']) {
        this.tickets.update((prev) => [...prev, this.mapNewTicket(t)]);
      } else {
        this.notification.set(true);
      }
    }
  });

  activeFilters: { [key: string]: string } = {};

  ngOnInit(): void {
    // this.ticketService.listAllTickets();
    this.route.queryParams.subscribe((params) => {
      this.activeFilters = params;
      console.log('Params: ', params);
      this.ticketService.getTickets(params);

      // clear notification
      if (this.activeFilters['status'] === 'open' || !this.activeFilters['status']) {
        this.notification.set(false);
      }
    });
  }

  onRowClick(ticket: TicketRow) {
    this.router.navigate([`/support/ticket/${ticket.id}`]);
  }

  setFilter(filters: { [key: string]: any }) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filters,
    });
  }
}
