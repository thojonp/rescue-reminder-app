import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }

  // Redirect zum Dashboard oder Login
  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};
