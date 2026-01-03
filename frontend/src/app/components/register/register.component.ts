import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  };

  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Validierung
    if (!this.registerData.email || !this.registerData.password || 
        !this.registerData.first_name || !this.registerData.last_name) {
      this.errorMessage = 'Bitte alle Felder ausfüllen';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Passwort muss mindestens 6 Zeichen lang sein';
      return;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage = 'Passwörter stimmen nicht überein';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      }
    });
  }
}