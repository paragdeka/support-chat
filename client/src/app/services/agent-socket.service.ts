import { inject, Injectable, signal } from '@angular/core';
import { TypingPayload } from './customer-socket.service';
import { io, Socket } from 'socket.io-client';
import { AgentAuthService } from './agent-auth.service';

interface AgentJoinPayload {
  agentId: string;
}

interface UnassignedTicketPayload {
  id: string;
  subject: string;
  customerName: string;
  priority: 'high' | 'low' | 'medium';
  createdAt: Date;
  status: 'open';
}

interface TicketAssignPayload {
  agentId: string;
  ticketId: string;
}

interface AgentMessagePayload {
  agentId: string;
  ticketId: string;
  text: string;
}

interface ClientToServerEvents {
  agent_join: (p: AgentJoinPayload, cb?: (ack: { ok: boolean }) => void) => void;
  typing: (p: TypingPayload) => void;
  ticket_assign: (
    p: TicketAssignPayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void; // agent self assigns
  ticket_close: (p: TicketAssignPayload, cb?: (ack: { ok: boolean }) => void) => void;
  agent_message: (
    p: AgentMessagePayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
}

interface ServerToClientEvents {
  typing: (p: TypingPayload) => void;
  unassigned_ticket: (p: UnassignedTicketPayload) => void;
}

@Injectable({
  providedIn: 'root',
})
export class AgentSocketService {
  private socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private agentAuthService = inject(AgentAuthService);

  readonly unassignedTicket = signal<UnassignedTicketPayload | undefined>(undefined);

  private addUnassignedTicket(ticket: UnassignedTicketPayload) {
    this.unassignedTicket.set(ticket);
  }

  connect(url: string) {
    const agentId = this.agentAuthService.agentProfile()?.id;
    if (!agentId) {
      console.log('No agent id');
      return;
    }
    this.socket = io(url, { autoConnect: true });

    this.socket.on('connect', () => {
      console.log('Socket connected: ', this.socket.id, agentId);
      this.socket.emit('agent_join', { agentId }, (ack) => {
        if (!ack.ok) {
          console.error('Agent failed to join.');
        }
      });
    });

    this.socket.on('unassigned_ticket', (ticket) => {
      console.log('Unassigned ticket through WS: ', ticket);
      this.addUnassignedTicket(ticket);
    });
  }
}
