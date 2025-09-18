import { Component } from '@angular/core';
import { TicketTable } from '../ticket-table/ticket-table';

@Component({
  selector: 'app-dashboard',
  imports: [TicketTable],
  templateUrl: './dashboard.html',
})
export class Dashboard {}
