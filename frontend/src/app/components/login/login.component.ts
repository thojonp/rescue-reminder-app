import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;
  showForgotPassword = false;
  resetEmail = '';
  resetMessage = '';
  resetMessageType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Bitte Email und Passwort eingeben';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        const user = response.user;
        
        if (user.is_admin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.';
        console.error('Login error:', error);
        console.log('Error message set to:', this.errorMessage);
      }
    });
  }

  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.resetEmail = '';
    this.resetMessage = '';
    this.errorMessage = '';
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.resetEmail = '';
    this.resetMessage = '';
  }

  onResetPassword(): void {
    if (!this.resetEmail) {
      this.resetMessage = 'Bitte Email-Adresse eingeben';
      this.resetMessageType = 'error';
      return;
    }

    this.isLoading = true;
    this.resetMessage = '';

    this.authService.requestPasswordReset(this.resetEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetMessage = 'Ein Link zum Zurücksetzen wurde an Ihre Email gesendet.';
        this.resetMessageType = 'success';
        
        // Modal nach 3 Sekunden schließen
        setTimeout(() => {
          this.closeForgotPassword();
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.resetMessage = error.error?.error || 'Fehler beim Senden. Bitte versuchen Sie es erneut.';
        this.resetMessageType = 'error';
      }
    });
  }
}