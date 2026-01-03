import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserWithDeviceCount } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  // Alle Benutzer abrufen (nur Admin)
  getAllUsers(): Observable<UserWithDeviceCount[]> {
    return this.http.get<UserWithDeviceCount[]>(this.apiUrl);
  }

  // Eigenes Konto deaktivieren
  deactivateMyAccount(): Observable<any> {
    return this.http.put(`${this.apiUrl}/deactivate`, {});
  }

  // Eigenes Konto löschen
  deleteMyAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me`);
  }

  // Admin: Benutzer löschen
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }

  // Admin: Benutzer aktivieren/deaktivieren
  toggleUserActive(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/toggle-active`, {});
  }
}
