import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  // Token zu Request hinzufügen (außer für Login/Register)
  let authReq = req;
  if (token && !req.url.includes('/login') && !req.url.includes('/register')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  console.log('HTTP Request:', req.method, req.url);

  return next(authReq).pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);
      console.error('Error Status:', error.status);
      console.error('Error Body:', error.error);

      // Bei 401 (Unauthorized) zum Login
      if (error.status === 401 && !req.url.includes('/login')) {
        console.log('Unauthorized - Redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        router.navigate(['/login']);
      }

      // Fehler weitergeben
      return throwError(() => error);
    })
  );
};