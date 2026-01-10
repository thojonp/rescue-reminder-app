import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { MessagesComponent } from '../shared/messages.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MessagesComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  tokenValid = true;
  resetSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Token aus URL-Parameter holen
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.token = params['token'];
        
        if (!this.token) {
          this.tokenValid = false;
          this.messageService.error('Kein gültiger Reset-Token gefunden.');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    // Validierung
    if (!this.newPassword || !this.confirmPassword) {
      this.messageService.error('Bitte beide Felder ausfüllen');
      return;
    }

    if (this.newPassword.length < 6) {
      this.messageService.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.error('Passwörter stimmen nicht überein');
      return;
    }

    if (!this.token) {
      this.messageService.error('Kein gültiger Token');
      return;
    }

    this.isLoading = true;
    this.messageService.clear();

    this.authService.resetPassword(this.token, this.newPassword)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.resetSuccess = true;
          this.messageService.success('Passwort erfolgreich zurückgesetzt! Sie werden weitergeleitet...');

          // Nach 2 Sekunden zum Login weiterleiten
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(
            error,
            'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen.'
          );
          this.messageService.error(errorMsg);
        }
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
