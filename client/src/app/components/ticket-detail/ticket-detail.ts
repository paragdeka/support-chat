import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageDisplay, TicketRow, TicketService } from '../../services/ticket.service';
import { formatRelativeDate } from '../../utils';
import { ChatWindow } from '../chat-window/chat-window';
import { AgentSocketService } from '../../services/agent-socket.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface TicketDetailType extends TicketRow {
  messages: MessageDisplay[];
}

@Component({
  selector: 'app-ticket-detail',
  imports: [ChatWindow, MatButtonModule, CommonModule],
  templateUrl: './ticket-detail.html',
})
export class TicketDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketSerivce = inject(TicketService);
  private agentSocketService = inject(AgentSocketService);

  private retryJoiningTicketRoom = effect(() => {
    if (this.agentSocketService.isConnected()) {
      const ticketId = this.route.snapshot.paramMap.get('id');
      this.agentSocketService.rejoinTicketRoom(ticketId!);
    }
  });

  readonly ticketDetail = signal<TicketDetailType | undefined>(undefined);

  private updateTicketStatus = effect(() => {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.agentSocketService.ticketStatuses()[id].selfAssigned) {
      this.ticketDetail.update((prev) => (prev ? { ...prev, status: 'in-progress' } : prev));
    }
    if (id && this.agentSocketService.ticketStatuses()[id].ticketClosed) {
      this.ticketDetail.update((prev) => (prev ? { ...prev, status: 'closed' } : prev));
    }
  });

  messages = computed(
    () => this.agentSocketService.messages()[this.ticketDetail()?.id ?? ''] ?? []
  );
  combinedMessages = computed(() => [...(this.ticketDetail()?.messages ?? []), ...this.messages()]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketSerivce.getTicketDetail(id).subscribe({
        next: (result) => {
          const msgs: MessageDisplay[] = result.messages.map(
            (msg): MessageDisplay => ({
              sender: msg.sender as MessageDisplay['sender'],
              text: msg.text,
              createdAt: formatRelativeDate(new Date(msg.createdAt)),
              customerName: msg.customerName,
              agentName: msg.agentId?.name,
              id: msg._id,
            })
          );

          const ticketD: TicketDetailType = {
            id: result._id,
            createdAt: formatRelativeDate(new Date(result.createdAt)),
            customerName: result.messages[0]?.customerName!,
            priority: result.priority as TicketRow['priority'],
            issue: result.messages[0].text,
            status: result.status as TicketRow['status'],
            messages: msgs,
          };

          console.log('Ticket Detail: ', ticketD);
          this.ticketDetail.set(ticketD);
        },
        error: (err) => {
          console.error('Ticket detail fetch failed: ', err);
        },
      });
    }
  }

  sendMessage({ text }: { text: string }) {
    const ticketId = this.ticketDetail()?.id;
    if (!ticketId) return;

    // optimistic add
    this.agentSocketService.messages.update((prev) => {
      const arr = prev[ticketId] ?? [];
      return {
        ...prev,
        [ticketId]: [
          ...arr,
          {
            id: crypto.randomUUID(), // temporary id only for UI, cause id is used in the template's for loop
            sender: 'agent',
            text,
            createdAt: formatRelativeDate(new Date()),
            agentName: 'You',
          },
        ],
      };
    });

    this.agentSocketService.sendAgentMessage(text, ticketId);
  }

  onSelfAssignClick() {
    const ticketId = this.ticketDetail()?.id;
    console.log('Self assign: ', ticketId);
    if (ticketId) {
      this.agentSocketService.selfAssignTicket(ticketId);
    }
  }

  onTicketCloseClick() {
    const ticketId = this.ticketDetail()?.id;
    console.log('Close ticket: ', ticketId);
    if (ticketId) {
      this.agentSocketService.closeTicket(ticketId);
    }
  }
}
