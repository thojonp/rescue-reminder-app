import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserWithDeviceCount } from '../models/user.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl + '/users';
  private debugUrl = environment.apiUrl + '/debug';

  constructor(private http: HttpClient) {}

  // Alle Benutzer abrufen (nur Admin)
  getAllUsers(): Observable<UserWithDeviceCount[]> {
    return this.http.get<UserWithDeviceCount[]>(this.apiUrl);
  }

  // Eigene Email aktualisieren
  updateMyEmail(email: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-email`, { email });
  }

  // Admin: Benutzer-Email aktualisieren
  updateUserEmail(userId: number, email: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/update-email`, { email });
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

  // Admin: Test-Email senden
  sendTestEmail(email: string): Observable<any> {
    return this.http.post(`${this.debugUrl}/send-test-email`, { email });
  }

  // Admin: Email-Verbindung testen
  testEmailConnection(): Observable<any> {
    return this.http.get(`${this.debugUrl}/test-email-connection`);
  }
}