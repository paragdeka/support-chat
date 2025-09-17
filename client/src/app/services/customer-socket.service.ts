import { inject, Injectable, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { CustomerDataService } from './customer-data.service';
import { ChatMessagePayload } from './agent-socket.service';
import { MessageDisplay } from './ticket.service';
import { formatRelativeDate } from '../utils';

interface CustomerJoinPayload {
  sessionId: string;
  customerName: string;
}

interface CustomerMessagePayload extends CustomerJoinPayload {
  text: string;
}

export interface TypingPayload {
  ticketId: string;
  sessionId?: string;
  agentId?: string;
  isTyping: boolean;
}

interface SystemMessagePayload {
  text: string;
}

interface ClientToServerEvents {
  customer_join: (p: CustomerJoinPayload, cb?: (ack: { ok: boolean }) => void) => void;
  customer_message: (
    p: CustomerMessagePayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
  typing: (p: TypingPayload) => void;
}

interface ServerToClientEvents {
  typing: (p: TypingPayload) => void;
  system_message: (p: SystemMessagePayload) => void;
  chat_message: (p: ChatMessagePayload) => void;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerSocketService {
  private socket!: Socket<ServerToClientEvents, ClientToServerEvents>;
  private customerDataService = inject(CustomerDataService);

  readonly messages = signal<MessageDisplay[]>([]);

  private addMessage(msg: ChatMessagePayload) {
    if (msg.from === 'agent') {
      this.messages.update((prev) => [
        ...prev,
        {
          createdAt: formatRelativeDate(msg.createdAt),
          id: msg.id,
          sender: msg.from,
          text: msg.text,
          agentName: msg.fromName,
        },
      ]);
    }
  }

  connect(url: string) {
    const customer = this.customerDataService.getOrCreate();
    this.socket = io(url, { autoConnect: true });

    this.socket.on('connect', () => {
      this.socket.emit(
        'customer_join',
        { customerName: customer.name, sessionId: customer.id },
        (ack) => {
          if (!ack.ok) {
            console.error('Failed to join.');
          }
        }
      );
    });

    this.socket.on('system_message', ({ text }) => {
      this.messages.update((prev) => [
        ...prev,
        {
          createdAt: formatRelativeDate(new Date()),
          id: crypto.randomUUID(),
          sender: 'system',
          text,
        },
      ]);
    });

    this.socket.on('chat_message', (payload) => {
      this.addMessage(payload);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

  sendMessage(text: string) {
    const customer = this.customerDataService.getOrCreate();
    this.socket.emit(
      'customer_message',
      {
        customerName: customer.name,
        sessionId: customer.id,
        text,
      },
      (ack) => {
        if (!ack.ok) {
          console.error(ack.error);
        }
      }
    );

    this.messages.update((prev) => [
      ...prev,
      {
        createdAt: formatRelativeDate(new Date()),
        id: crypto.randomUUID(),
        sender: 'customer',
        text,
      },
    ]);
  }
}
