import { Component, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MessageService, Message } from '../../services/message.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  template: `
    <div class="messages-container" *ngIf="(messages$ | async)?.length">
      @for (message of messages$ | async; track message.id) {
        <div 
          class="alert"
          [class.alert-success]="message.type === 'success'"
          [class.alert-error]="message.type === 'error'"
          [class.alert-info]="message.type === 'info'"
          [class.alert-warning]="message.type === 'warning'"
          (click)="dismiss(message.id)"
        >
          <span class="message-icon">
            @switch (message.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="message-text">{{ message.text }}</span>
          <button class="dismiss-btn" (click)="dismiss(message.id); $event.stopPropagation()">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .messages-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .alert {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      transition: opacity 0.2s, transform 0.2s;
    }

    .alert:hover {
      transform: translateX(-5px);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .alert-success {
      background-color: #d4edda;
      border: 1px solid #28a745;
      color: #155724;
    }

    .alert-error {
      background-color: #f8d7da;
      border: 1px solid #dc3545;
      color: #721c24;
    }

    .alert-info {
      background-color: #d1ecf1;
      border: 1px solid #17a2b8;
      color: #0c5460;
    }

    .alert-warning {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
    }

    .message-icon {
      margin-right: 10px;
      font-weight: bold;
      font-size: 16px;
    }

    .message-text {
      flex: 1;
      font-size: 14px;
    }

    .dismiss-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.6;
      padding: 0 0 0 10px;
      line-height: 1;
    }

    .dismiss-btn:hover {
      opacity: 1;
    }
  `]
})
export class MessagesComponent {
  messages$: Observable<Message[]>;

  constructor(private messageService: MessageService) {
    this.messages$ = this.messageService.messages$;
  }

  dismiss(id: number): void {
    this.messageService.dismiss(id);
  }
}
