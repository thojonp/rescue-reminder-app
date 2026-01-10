import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';

export interface Message {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$: Observable<Message[]> = this.messagesSubject.asObservable();

  private messageIdCounter = 0;

  /**
   * Zeigt eine Nachricht an
   * @param text Der anzuzeigende Text
   * @param type Der Typ der Nachricht (success, error, info, warning)
   * @param autoDismiss Zeit in ms bis die Nachricht automatisch verschwindet (0 = nie)
   */
  show(text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', autoDismiss: number = 5000): void {
    const id = ++this.messageIdCounter;
    const message: Message = { text, type, id };
    
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next([...currentMessages, message]);

    if (autoDismiss > 0) {
      timer(autoDismiss).subscribe(() => {
        this.dismiss(id);
      });
    }
  }

  /**
   * Zeigt eine Erfolgsmeldung an
   */
  success(text: string, autoDismiss: number = 5000): void {
    this.show(text, 'success', autoDismiss);
  }

  /**
   * Zeigt eine Fehlermeldung an
   */
  error(text: string, autoDismiss: number = 5000): void {
    this.show(text, 'error', autoDismiss);
  }

  /**
   * Zeigt eine Info-Meldung an
   */
  info(text: string, autoDismiss: number = 5000): void {
    this.show(text, 'info', autoDismiss);
  }

  /**
   * Zeigt eine Warnmeldung an
   */
  warning(text: string, autoDismiss: number = 5000): void {
    this.show(text, 'warning', autoDismiss);
  }

  /**
   * Entfernt eine Nachricht
   */
  dismiss(id: number): void {
    const currentMessages = this.messagesSubject.getValue();
    this.messagesSubject.next(currentMessages.filter(m => m.id !== id));
  }

  /**
   * Entfernt alle Nachrichten
   */
  clear(): void {
    this.messagesSubject.next([]);
  }

  /**
   * Extrahiert die Fehlermeldung aus einer HTTP-Fehlerantwort
   */
  extractErrorMessage(error: any, defaultMessage: string = 'Ein Fehler ist aufgetreten'): string {
    if (error?.error?.error) {
      return error.error.error;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return defaultMessage;
  }
}
