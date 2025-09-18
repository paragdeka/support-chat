import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MessageDisplay } from '../../services/ticket.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat-window.html',
})
export class ChatWindow {
  messagesInput = input<MessageDisplay[]>([]);
  self = input<MessageDisplay['sender']>('customer');
  messageSent = output<{ text: string }>();
  disabled = input<boolean>(false);
  chatContainer = viewChild<ElementRef>('chatContainer');
  showSpinner = input<boolean>(false);

  private scrollChat = effect(() => {
    this.messagesInput().length;
    console.log('Effect running..');
    setTimeout(() => this.scrollToBottom(), 0);
  });

  private fb = inject(FormBuilder);
  messageForm = this.fb.group({
    message: ['', [Validators.required]],
  });

  private chatDisable = effect(() => {
    if (this.disabled()) {
      this.messageForm.disable();
    } else {
      this.messageForm.enable();
    }
  });

  onSubmit() {
    if (this.messageForm.valid) {
      const text = this.messageForm.value.message?.trim()!;

      this.messageSent.emit({ text });

      this.messageForm.reset();
    }
  }

  private scrollToBottom() {
    const container = this.chatContainer();
    if (container) {
      container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
    }
  }
}
