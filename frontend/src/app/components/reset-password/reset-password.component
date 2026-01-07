import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  tokenValid = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Token aus URL-Parameter holen
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.tokenValid = false;
        this.errorMessage = 'Kein gültiger Reset-Token gefunden.';
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    // Validierung
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Bitte beide Felder ausfüllen';
      this.cdr.markForCheck();
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Passwort muss mindestens 6 Zeichen lang sein';
      this.cdr.markForCheck();
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwörter stimmen nicht überein';
      this.cdr.markForCheck();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Kein gültiger Token';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Passwort erfolgreich zurückgesetzt! Sie werden weitergeleitet...';
        this.cdr.markForCheck();

        // Nach 2 Sekunden zum Login weiterleiten
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Fehler beim Zurücksetzen des Passworts. Der Link ist möglicherweise abgelaufen.';
        this.cdr.markForCheck();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}