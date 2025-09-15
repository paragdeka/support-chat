import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CustomerSocketService } from '../../services/customer-socket.service';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  sender: 'agent' | 'user' | 'system';
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  private customerSocketService = inject(CustomerSocketService);

  ngOnInit(): void {
    this.customerSocketService.connect(environment.baseUrl);
  }
  ngOnDestroy(): void {
    this.customerSocketService.disconnect();
  }

  isOpen = signal(false);
  messages = this.customerSocketService.messages;

  private fb = inject(FormBuilder);
  messageForm = this.fb.group({
    message: ['', [Validators.required]],
  });

  toggleChat() {
    this.isOpen.update((v) => !v);
  }

  onSubmit() {
    if (this.messageForm.valid) {
      const text = this.messageForm.value.message?.trim()!;
      this.customerSocketService.sendMessage(text);

      this.messageForm.reset();
    }
  }
}
