import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

interface ChatMessage {
  sender: 'agent' | 'user';
  text: string;
  timestamp: Date;
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
export class Chat {
  isOpen = signal(false);

  messages = signal<ChatMessage[]>([
    { sender: 'agent', text: 'Hi, how can I help you today?', timestamp: new Date() },
  ]);

  private fb = inject(FormBuilder);

  messageForm = this.fb.group({
    message: ['', [Validators.required]],
  });

  toggleChat() {
    this.isOpen.update((v) => !v);
  }

  private addMessage(sender: 'user' | 'agent', text: string) {
    this.messages.update((msgs) => [...msgs, { sender, text, timestamp: new Date() }]);
  }

  onSubmit() {
    const text = this.messageForm.value.message?.trim();
    if (!text) return;

    this.addMessage('user', text);
    this.messageForm.reset();

    // fake reply
    setTimeout(() => {
      this.addMessage('agent', 'Got it!');
    }, 1000);
  }
}
