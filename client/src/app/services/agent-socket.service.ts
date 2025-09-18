import { inject, Injectable, signal } from '@angular/core';
import { TypingPayload } from './customer-socket.service';
import { io, Socket } from 'socket.io-client';
import { AgentAuthService } from './agent-auth.service';
import { MessageDisplay } from './ticket.service';
import { formatRelativeDate } from '../utils';

export interface ChatMessagePayload {
  from: 'customer' | 'agent';
  fromId: string;
  fromName: string;
  text: string;
  id: string;
  createdAt: Date;
  ticketId: string;
}

interface AgentJoinPayload {
  agentId: string;
}

export interface UnassignedTicketPayload {
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
  agent_join_ticket_room: (
    p: TicketAssignPayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
}

interface ServerToClientEvents {
  typing: (p: TypingPayload) => void;
  unassigned_ticket: (p: UnassignedTicketPayload) => void;
  chat_message: (p: ChatMessagePayload) => void;
}

@Injectable({
  providedIn: 'root',
})
export class AgentSocketService {
  private socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private agentAuthService = inject(AgentAuthService);

  readonly isConnected = signal<boolean>(false);
  readonly unassignedTicket = signal<UnassignedTicketPayload | undefined>(undefined);
  readonly messages = signal<Record<string, MessageDisplay[]>>({});
  readonly ticketStatuses = signal<
    Record<string, { selfAssigned: boolean; ticketClosed: boolean }>
  >({});

  private addMessage(msg: ChatMessagePayload) {
    if (msg.from === 'customer') {
      this.messages.update((prev) => {
        const arr = prev[msg.ticketId] ?? [];
        return {
          ...prev,
          [msg.ticketId]: [
            ...arr,
            {
              id: msg.id,
              createdAt: formatRelativeDate(msg.createdAt),
              sender: msg.from,
              text: msg.text,
              customerName: msg.fromName,
            },
          ],
        };
      });
    }
  }

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
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('unassigned_ticket', (ticket) => {
      console.log('Unassigned ticket through WS: ', ticket);
      this.addUnassignedTicket(ticket);
    });

    this.socket.on('chat_message', (payload) => {
      console.log('Chat from customer: ', payload);
      this.addMessage(payload);
    });
  }

  selfAssignTicket(ticketId: string) {
    const agentId = this.agentAuthService.agentProfile()?.id;
    if (agentId) {
      this.socket.emit(
        'ticket_assign',
        {
          ticketId,
          agentId,
        },
        (ack) => {
          if (ack.ok) {
            this.ticketStatuses.update((prev) => {
              const val = prev[ticketId] ?? {};
              return {
                ...prev,
                [ticketId]: {
                  ...val,
                  selfAssigned: true,
                },
              };
            });
          }
        }
      );
    }
  }

  closeTicket(ticketId: string) {
    const agentId = this.agentAuthService.agentProfile()?.id;
    if (agentId) {
      this.socket.emit('ticket_close', { ticketId, agentId }, (ack) => {
        if (ack.ok) {
          console.log('Ticket close success!');
          this.ticketStatuses.update((prev) => {
            const val = prev[ticketId] ?? {};
            return {
              ...prev,
              [ticketId]: {
                ...val,
                ticketClosed: true,
              },
            };
          });
        }
      });
    }
  }

  sendAgentMessage(text: string, ticketId: string) {
    const agentId = this.agentAuthService.agentProfile()?.id;
    if (agentId) {
      this.socket.emit('agent_message', {
        agentId,
        text,
        ticketId,
      });
    }
  }

  rejoinTicketRoom(ticketId: string) {
    const agentId = this.agentAuthService.agentProfile()?.id;
    if (agentId) {
      this.socket.emit('agent_join_ticket_room', {
        agentId,
        ticketId,
      });
    }
  }
}
