import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device, DeviceWithUser, DeviceFormData } from '../models/device.model';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private apiUrl = 'http://localhost:3000/api/devices';

  constructor(private http: HttpClient) {}

  // Eigene Geräte abrufen
  getMyDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl);
  }

  // Alle Geräte abrufen (nur Admin)
  getAllDevices(): Observable<DeviceWithUser[]> {
    return this.http.get<DeviceWithUser[]>(`${this.apiUrl}/all`);
  }

  // Geräte eines bestimmten Benutzers abrufen (nur Admin)
  getUserDevices(userId: number): Observable<DeviceWithUser[]> {
    return this.http.get<DeviceWithUser[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Neues Gerät erstellen
  createDevice(device: DeviceFormData): Observable<any> {
    return this.http.post(this.apiUrl, device);
  }

  // Gerät aktualisieren
  updateDevice(id: number, device: DeviceFormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, device);
  }

  // Gerät löschen
  deleteDevice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Hilfsfunktion: Berechne nächstes Fälligkeitsdatum
  calculateNextDueDate(lastPacked: string, interval: number): Date {
    const date = new Date(lastPacked);
    date.setMonth(date.getMonth() + interval);
    return date;
  }

  // Hilfsfunktion: Prüfe ob Erinnerung fällig ist
  isOverdue(lastPacked: string, interval: number): boolean {
    const dueDate = this.calculateNextDueDate(lastPacked, interval);
    return new Date() > dueDate;
  }

  // Hilfsfunktion: Tage bis zur nächsten Überprüfung
  daysUntilDue(lastPacked: string, interval: number): number {
    const dueDate = this.calculateNextDueDate(lastPacked, interval);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}