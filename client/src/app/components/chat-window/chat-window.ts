import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageDisplay } from '../../services/ticket.service';

@Component({
  selector: 'app-chat-window',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TitleCasePipe,
  ],
  templateUrl: './chat-window.html',
})
export class ChatWindow {
  messagesInput = input<MessageDisplay[]>([]);
  self = input<MessageDisplay['sender']>('customer');
  messageSent = output<{ text: string }>();

  private fb = inject(FormBuilder);
  messageForm = this.fb.group({
    message: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.messageForm.valid) {
      const text = this.messageForm.value.message?.trim()!;

      this.messageSent.emit({ text });

      this.messageForm.reset();
    }
  }
}
