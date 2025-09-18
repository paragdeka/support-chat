import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CustomerSocketService } from '../../services/customer-socket.service';
import { environment } from '../../../environments/environment';
import { ChatWindow } from '../../components/chat-window/chat-window';
import { MatIconModule } from '@angular/material/icon';
import { CustomerDataService } from '../../services/customer-data.service';
import { MessageDisplay, TicketService } from '../../services/ticket.service';
import { formatRelativeDate } from '../../utils';
import { Title } from '@angular/platform-browser';

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
  readonly chatDisabled = signal<boolean>(false);
  private titleService = inject(Title);
  readonly msgHistoryFetching = signal<boolean>(false);
  readonly agentIsTyping = this.customerSocketService.typingIndicator;

  ngOnInit(): void {
    this.titleService.setTitle('Customer Chat');
    this.customerSocketService.connect(environment.baseUrl);

    const customer = this.customerDataService.getOrCreate();
    if (customer.id) {
      this.msgHistoryFetching.set(true);
      this.ticketService.getTicketMessageHistory(customer.id).subscribe({
        next: (result) => {
          this.msgHistoryFetching.set(false);
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
        error: (err) => {
          this.msgHistoryFetching.set(false);
          console.error(err);
        },
      });
    }
  }
  ngOnDestroy(): void {
    this.customerSocketService.disconnect();
  }

  messages = this.customerSocketService.messages;
  combinedMessages = computed(() => [...this.messageHistory(), ...this.messages()]);

  private syncTicketClose = effect(() => {
    const msgs = this.messages();
    const last = msgs[msgs.length - 1];

    // using this as hack, cause I'm running out of time
    if (last?.sender === 'system' && last?.text.includes('has been closed')) {
      this.chatDisabled.set(true);
    }
  });

  sendCustomerMessage({ text }: { text: string }) {
    console.log('Msg: ', text);
    this.customerSocketService.sendMessage(text);
  }

  onCustomerIsTyping() {
    this.customerSocketService.sendCustomerTypingEvent();
  }
}
