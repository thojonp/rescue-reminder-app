import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil, finalize, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message.service';
import { Device, DeviceFormData } from '../../models/device.model';
import { User } from '../../models/user.model';
import { MessagesComponent } from '../shared/messages.component';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, MessagesComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable für Geräte
  private devicesSubject = new BehaviorSubject<Device[]>([]);
  devices$: Observable<Device[]> = this.devicesSubject.asObservable();
  
  // Observable für Loading-State
  private isLoadingDevicesSubject = new BehaviorSubject<boolean>(true);
  isLoadingDevices$: Observable<boolean> = this.isLoadingDevicesSubject.asObservable();

  currentUser: User | null = null;
  showAddForm = false;
  showAccountSettings = false;
  editingDevice: Device | null = null;
  newEmail = '';
  isLoading = false;

  deviceForm: DeviceFormData = {
    name: '',
    serial_number: '',
    notes: '',
    last_packed: new Date().toISOString().split('T')[0],
    reminder_interval: 12,
    reminder_enabled: true
  };

  reminderIntervals = [
    { value: 6, label: '6 Monate' },
    { value: 9, label: '9 Monate' },
    { value: 12, label: '12 Monate (Standard)' }
  ];

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.newEmail = user.email;
        }
      });
    
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDevices(): void {
    this.isLoadingDevicesSubject.next(true);
    
    this.deviceService.getMyDevices()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingDevicesSubject.next(false))
      )
      .subscribe({
        next: (devices) => {
          this.devicesSubject.next(devices);
        },
        error: (error) => {
          this.messageService.error('Fehler beim Laden der Geräte');
          this.devicesSubject.next([]);
        }
      });
  }

  openAddForm(): void {
    this.showAddForm = true;
    this.editingDevice = null;
    this.resetForm();
  }

  openEditForm(device: Device): void {
    this.editingDevice = device;
    this.showAddForm = true;
    this.deviceForm = {
      name: device.device_name,
      serial_number: device.serial_number || '',
      notes: device.notes || '',
      last_packed: device.last_packed.split('T')[0],
      reminder_interval: device.reminder_interval || 12,
      reminder_enabled: device.reminder_enabled !== false
    };
  }

  closeForm(): void {
    this.showAddForm = false;
    this.editingDevice = null;
    this.resetForm();
  }

  resetForm(): void {
    this.deviceForm = {
      name: '',
      serial_number: '',
      notes: '',
      last_packed: new Date().toISOString().split('T')[0],
      reminder_interval: 12,
      reminder_enabled: true
    };
  }

  onSubmit(): void {
    if (!this.deviceForm.name || !this.deviceForm.last_packed) {
      this.messageService.error('Name und Packdatum sind erforderlich');
      return;
    }

    this.isLoading = true;

    const request$ = this.editingDevice
      ? this.deviceService.updateDevice(this.editingDevice.id!, this.deviceForm)
      : this.deviceService.createDevice(this.deviceForm);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          const msg = this.editingDevice 
            ? 'Gerät erfolgreich aktualisiert' 
            : 'Gerät erfolgreich hinzugefügt';
          this.messageService.success(msg);
          this.closeForm();
          this.loadDevices();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(
            error,
            this.editingDevice ? 'Fehler beim Aktualisieren' : 'Fehler beim Hinzufügen'
          );
          this.messageService.error(errorMsg);
        }
      });
  }

  deleteDevice(device: Device): void {
    if (!confirm(`Möchten Sie "${device.device_name}" wirklich löschen?`)) {
      return;
    }

    this.deviceService.deleteDevice(device.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.success('Gerät erfolgreich gelöscht');
          this.loadDevices();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler beim Löschen');
          this.messageService.error(errorMsg);
        }
      });
  }

  openAccountSettings(): void {
    this.showAccountSettings = true;
    if (this.currentUser) {
      this.newEmail = this.currentUser.email;
    }
  }

  closeAccountSettings(): void {
    this.showAccountSettings = false;
  }

  updateEmail(): void {
    if (!this.newEmail || !this.newEmail.includes('@')) {
      this.messageService.error('Bitte gültige Email-Adresse eingeben');
      return;
    }

    this.userService.updateMyEmail(this.newEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.success('Email erfolgreich aktualisiert');
          if (this.currentUser) {
            this.currentUser.email = this.newEmail;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          }
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler beim Aktualisieren');
          this.messageService.error(errorMsg);
        }
      });
  }

  deactivateAccount(): void {
    if (!confirm('Möchten Sie Ihr Konto wirklich deaktivieren?')) {
      return;
    }

    this.userService.deactivateMyAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.success('Ihr Konto wurde deaktiviert.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler');
          this.messageService.error(errorMsg);
        }
      });
  }

  deleteAccount(): void {
    if (!confirm('ACHTUNG: Konto und ALLE Geräte löschen?')) {
      return;
    }

    this.userService.deleteMyAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.success('Ihr Konto wurde gelöscht.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler');
          this.messageService.error(errorMsg);
        }
      });
  }

  getNextDueDate(device: Device): Date {
    return this.deviceService.calculateNextDueDate(device.last_packed, device.reminder_interval);
  }

  getDaysUntilDue(device: Device): number {
    return this.deviceService.daysUntilDue(device.last_packed, device.reminder_interval);
  }

  isOverdue(device: Device): boolean {
    return this.deviceService.isOverdue(device.last_packed, device.reminder_interval);
  }

  getStatusClass(device: Device): string {
    const days = this.getDaysUntilDue(device);
    if (days < 0) return 'status-overdue';
    if (days <= 30) return 'status-warning';
    return 'status-ok';
  }

  getStatusText(device: Device): string {
    const days = this.getDaysUntilDue(device);
    if (days < 0) return `${Math.abs(days)} Tage überfällig`;
    if (days === 0) return 'Heute fällig';
    if (days === 1) return 'Morgen fällig';
    return `Noch ${days} Tage`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
