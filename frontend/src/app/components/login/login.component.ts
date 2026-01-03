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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Bitte alle Felder ausfüllen';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login erfolgreich, User:', response.user);
        console.log('is_admin:', response.user.is_admin);
        
        // Kurze Verzögerung um sicherzustellen dass der User gespeichert ist
        setTimeout(() => {
          // Redirect basierend auf Admin-Status
          if (response.user.is_admin === true) {
            console.log('Redirect zu Admin-Dashboard');
            this.router.navigate(['/admin']);
          } else {
            console.log('Redirect zu User-Dashboard');
            this.router.navigate(['/dashboard']);
          }
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login-Fehler:', error);
        this.errorMessage = error.error?.error || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.';
      }
    });
  }
}