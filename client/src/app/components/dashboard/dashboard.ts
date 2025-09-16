import { Component, effect, inject, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TicketRow, TicketService } from '../../services/ticket.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgentSocketService } from '../../services/agent-socket.service';
import { formatRelativeDate } from '../../utils';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    TitleCasePipe,
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private ticketService = inject(TicketService);
  columns: string[] = ['id', 'status', 'customerName', 'issue', 'priority', 'createdAt'];
  dataSource = new MatTableDataSource<TicketRow>([]);
  tickets = this.ticketService.tickets;

  private agentSocketService = inject(AgentSocketService);
  newTicket = this.agentSocketService.unassignedTicket;

  private syncTickets = effect(() => {
    this.dataSource.data = this.tickets();
    console.log('Formatted: ', this.tickets());
  });
  private syncNewTickets = effect(() => {
    const newT = this.newTicket();
    if (newT) {
      this.dataSource.data = [
        ...this.dataSource.data,
        {
          createdAt: formatRelativeDate(newT.createdAt),
          customerName: newT.customerName,
          id: newT.id,
          issue: newT.subject,
          priority: newT.priority,
          status: newT.status,
        },
      ];
    }
  });

  ngOnInit(): void {
    this.ticketService.listAllTickets();
  }

  onRowClick(row: TicketRow) {
    console.log('Clicked row:', row);
  }
}
