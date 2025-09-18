import { Component, inject, OnInit } from '@angular/core';
import { TicketTable } from '../ticket-table/ticket-table';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  imports: [TicketTable],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private titleService = inject(Title);

  ngOnInit(): void {
    this.titleService.setTitle('🎫 Tickets');
  }
}
