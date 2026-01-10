import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { LoginRequest } from '../../models/user.model';
import { MessagesComponent } from '../shared/messages.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MessagesComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  isLoading = false;
  showForgotPassword = false;
  resetEmail = '';

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
    // Validierung
    if (!this.loginData.email || !this.loginData.password) {
      this.messageService.error('Bitte Email und Passwort eingeben');
      return;
    }

    this.isLoading = true;
    this.messageService.clear();

    this.authService.login(this.loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          const user = response.user;
          
          if (user.is_admin) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(
            error, 
            'Login fehlgeschlagen. Bitte versuchen Sie es erneut.'
          );
          this.messageService.error(errorMsg);
          console.error('Login error:', error);
        }
      });
  }

  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.resetEmail = '';
    this.messageService.clear();
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.resetEmail = '';
  }

  onResetPassword(): void {
    if (!this.resetEmail) {
      this.messageService.error('Bitte Email-Adresse eingeben');
      return;
    }

    this.isLoading = true;

    this.authService.requestPasswordReset(this.resetEmail)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.messageService.success('Ein Link zum Zurücksetzen wurde an Ihre Email gesendet.');
          
          // Modal nach 3 Sekunden schließen
          setTimeout(() => {
            this.closeForgotPassword();
          }, 3000);
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(
            error,
            'Fehler beim Senden. Bitte versuchen Sie es erneut.'
          );
          this.messageService.error(errorMsg);
        }
      });
  }
}
