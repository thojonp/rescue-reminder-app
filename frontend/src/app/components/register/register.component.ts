import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { RegisterRequest } from '../../models/user.model';
import { MessagesComponent } from '../shared/messages.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MessagesComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  registerData: RegisterRequest = {
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  };

  confirmPassword = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    // Felder trimmen
    const email = this.registerData.email?.trim() || '';
    const password = this.registerData.password || '';
    const firstName = this.registerData.first_name?.trim() || '';
    const lastName = this.registerData.last_name?.trim() || '';

    // Validierung
    if (!email || !password || !firstName || !lastName) {
      this.messageService.error('Bitte alle Felder ausfüllen');
      return;
    }

    if (password.length < 6) {
      this.messageService.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (password !== this.confirmPassword) {
      this.messageService.error('Passwörter stimmen nicht überein');
      return;
    }

    this.isLoading = true;
    this.messageService.clear();

    // Getrimmte Daten senden
    const dataToSend = {
      email,
      password,
      first_name: firstName,
      last_name: lastName
    };

    console.log('Registering with data:', dataToSend);

    this.authService.register(dataToSend)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.messageService.success('Registrierung erfolgreich!');
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          const errorMsg = this.messageService.extractErrorMessage(
            error,
            'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
          );
          this.messageService.error(errorMsg);
        }
      });
  }
}
