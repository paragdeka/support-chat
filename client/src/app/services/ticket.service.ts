import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { formatRelativeDate } from '../utils';

interface MessageResponse {
  _id: string;
  sessionId: string;
  sender: string;
  text: string;
  ticketId: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  agentId: {
    name: string;
  };
}

interface TicketResponse {
  _id: string;
  sessionId: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageResponse[];
}

export interface TicketRow {
  id: string;
  customerName: string;
  issue: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'high' | 'low' | 'medium';
  createdAt: string;
}

export interface MessageDisplay {
  id: string;
  sender: 'agent' | 'customer' | 'system';
  text: string;
  createdAt: string;
  customerName?: string;
  agentName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ticket`;

  readonly tickets = signal<TicketRow[]>([]);
  readonly isFetching = signal<boolean>(false);

  listAllTickets() {
    this.isFetching.set(true);
    this.http.get<TicketResponse[]>(`${this.apiUrl}`).subscribe({
      next: (results) => {
        console.log('Tickets: ', results);
        const ticketRows: TicketRow[] = results.map((res) => ({
          id: res._id,
          createdAt: formatRelativeDate(new Date(res.createdAt)),
          customerName: res.messages[0].customerName!,
          priority: res.priority as TicketRow['priority'],
          issue: res.messages[0].text,
          status: res.status as TicketRow['status'],
        }));

        this.tickets.set(ticketRows);
        this.isFetching.set(false);
      },
      error: (err) => {
        console.error('Tickets fetching failed: ', err);
      },
    });
  }

  getTickets(filters: { [key: string]: any }) {
    this.isFetching.set(true);

    const params = new HttpParams({ fromObject: filters });
    this.http.get<TicketResponse[]>(`${this.apiUrl}`, { params }).subscribe({
      next: (results) => {
        console.log('Tickets: ', results);
        const ticketRows: TicketRow[] = results.map((res) => ({
          id: res._id,
          createdAt: formatRelativeDate(new Date(res.createdAt)),
          customerName: res.messages[0].customerName!,
          priority: res.priority as TicketRow['priority'],
          issue: res.messages[0].text,
          status: res.status as TicketRow['status'],
        }));

        this.tickets.set(ticketRows);
        this.isFetching.set(false);
      },
      error: (err) => {
        console.error('Tickets fetching failed: ', err);
      },
    });
  }

  getTicketDetail(id: string) {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}`);
  }

  getTicketMessageHistory(sessionId: string) {
    return this.http.get<TicketResponse>(`${this.apiUrl}/history/${sessionId}`);
  }
}
