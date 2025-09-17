import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CustomerSocketService } from '../../services/customer-socket.service';
import { environment } from '../../../environments/environment';
import { ChatWindow } from '../../components/chat-window/chat-window';
import { MatIconModule } from '@angular/material/icon';
import { CustomerDataService } from '../../services/customer-data.service';
import { MessageDisplay, TicketService } from '../../services/ticket.service';
import { formatRelativeDate } from '../../utils';

@Component({
  selector: 'app-chat',
  imports: [ChatWindow, MatIconModule],
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  private customerSocketService = inject(CustomerSocketService);
  private customerDataService = inject(CustomerDataService);
  private ticketService = inject(TicketService);
  private messageHistory = signal<MessageDisplay[]>([]);

  ngOnInit(): void {
    this.customerSocketService.connect(environment.baseUrl);

    const customer = this.customerDataService.getOrCreate();
    if (customer.id) {
      this.ticketService.getTicketMessageHistory(customer.id).subscribe({
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
          console.log(msgs);
          this.messageHistory.set(msgs);
        },
      });
    }
  }
  ngOnDestroy(): void {
    this.customerSocketService.disconnect();
  }

  messages = this.customerSocketService.messages;
  combinedMessages = computed(() => [...this.messageHistory(), ...this.messages()]);

  sendCustomerMessage({ text }: { text: string }) {
    console.log('Msg: ', text);
    this.customerSocketService.sendMessage(text);
  }
}
