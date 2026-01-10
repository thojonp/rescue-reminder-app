import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, finalize, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message.service';
import { UserWithDeviceCount } from '../../models/user.model';
import { DeviceWithUser, DeviceFormData } from '../../models/device.model';
import { MessagesComponent } from '../shared/messages.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, MessagesComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables für reaktive Daten
  private usersSubject = new BehaviorSubject<UserWithDeviceCount[]>([]);
  users$: Observable<UserWithDeviceCount[]> = this.usersSubject.asObservable();

  private devicesSubject = new BehaviorSubject<DeviceWithUser[]>([]);
  devices$: Observable<DeviceWithUser[]> = this.devicesSubject.asObservable();

  private selectedUserIdSubject = new BehaviorSubject<number | null>(null);
  selectedUserId$: Observable<number | null> = this.selectedUserIdSubject.asObservable();

  // Gefilterte Geräte als Observable
  filteredDevices$: Observable<DeviceWithUser[]> = combineLatest([
    this.devices$,
    this.selectedUserId$
  ]).pipe(
    map(([devices, userId]) => 
      userId === null ? devices : devices.filter(d => d.user_id === userId)
    )
  );

  private isLoadingUsersSubject = new BehaviorSubject<boolean>(true);
  isLoadingUsers$: Observable<boolean> = this.isLoadingUsersSubject.asObservable();

  private isLoadingDevicesSubject = new BehaviorSubject<boolean>(true);
  isLoadingDevices$: Observable<boolean> = this.isLoadingDevicesSubject.asObservable();

  // Statistiken als Observables
  totalDevices$: Observable<number> = this.devices$.pipe(map(d => d.length));
  activeDevices$: Observable<number> = this.devices$.pipe(
    map(devices => devices.filter(d => d.reminder_enabled && d.user_is_active).length)
  );
  overdueDevices$: Observable<number> = this.devices$.pipe(
    map(devices => devices.filter(d => this.isOverdue(d)).length)
  );
  upcomingDevices$: Observable<number> = this.devices$.pipe(
    map(devices => devices.filter(d => {
      const days = this.getDaysUntilDue(d);
      return days >= 0 && days <= 30;
    }).length)
  );
  activeUsers$: Observable<number> = this.users$.pipe(
    map(users => users.filter(u => u.is_active).length)
  );

  activeTab: 'users' | 'devices' | 'settings' = 'devices';
  showEditDeviceModal = false;
  showUserDevicesModal = false;
  showEditUserModal = false;
  editingDevice: DeviceWithUser | null = null;
  editingUser: UserWithDeviceCount | null = null;
  testEmailAddress = '';
  emailTestResult = '';
  isLoading = false;
  isTestingEmail = false;
  
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
    { value: 12, label: '12 Monate' }
  ];

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadDevices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoadingUsersSubject.next(true);
    
    this.userService.getAllUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingUsersSubject.next(false))
      )
      .subscribe({
        next: (users) => {
          this.usersSubject.next(users);
        },
        error: (error) => {
          this.messageService.error('Fehler beim Laden der Benutzer');
          this.usersSubject.next([]);
        }
      });
  }

  loadDevices(): void {
    this.isLoadingDevicesSubject.next(true);
    
    this.deviceService.getAllDevices()
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

  switchTab(tab: 'users' | 'devices' | 'settings'): void {
    this.activeTab = tab;
  }

  filterByUser(userId: number | null): void {
    this.selectedUserIdSubject.next(userId);
  }

  viewUserDevices(user: UserWithDeviceCount): void {
    this.selectedUserIdSubject.next(user.id);
    this.showUserDevicesModal = true;
  }

  closeUserDevicesModal(): void {
    this.showUserDevicesModal = false;
    this.selectedUserIdSubject.next(null);
  }

  openEditDevice(device: DeviceWithUser): void {
    this.editingDevice = device;
    this.showEditDeviceModal = true;
    this.deviceForm = {
      name: device.device_name,
      serial_number: device.serial_number || '',
      notes: device.notes || '',
      last_packed: device.last_packed.split('T')[0],
      reminder_interval: device.reminder_interval || 12,
      reminder_enabled: device.reminder_enabled !== false
    };
  }

  closeEditDeviceModal(): void {
    this.showEditDeviceModal = false;
    this.editingDevice = null;
  }

  onUpdateDevice(): void {
    if (!this.editingDevice || !this.deviceForm.name || !this.deviceForm.last_packed) {
      this.messageService.error('Name und Packdatum sind erforderlich');
      return;
    }

    this.isLoading = true;

    this.deviceService.updateDevice(this.editingDevice.id!, this.deviceForm)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.messageService.success('Gerät erfolgreich aktualisiert');
          this.closeEditDeviceModal();
          this.loadDevices();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler beim Aktualisieren');
          this.messageService.error(errorMsg);
        }
      });
  }

  deleteDevice(device: DeviceWithUser): void {
    const userName = `${device.user_first_name} ${device.user_last_name}`;
    if (!confirm(`Möchten Sie "${device.device_name}" von ${userName} wirklich löschen?`)) {
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

  openEditUser(user: UserWithDeviceCount): void {
    this.editingUser = { ...user };
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.editingUser = null;
  }

  onUpdateUserEmail(): void {
    if (!this.editingUser || !this.editingUser.email) {
      this.messageService.error('Email ist erforderlich');
      return;
    }

    this.isLoading = true;

    this.userService.updateUserEmail(this.editingUser.id, this.editingUser.email)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.messageService.success('Email erfolgreich aktualisiert');
          this.closeEditUserModal();
          this.loadUsers();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler beim Aktualisieren');
          this.messageService.error(errorMsg);
        }
      });
  }

  toggleUserActive(user: UserWithDeviceCount): void {
    const action = user.is_active ? 'deaktivieren' : 'aktivieren';
    if (!confirm(`Möchten Sie ${user.first_name} ${user.last_name} wirklich ${action}?`)) {
      return;
    }

    this.userService.toggleUserActive(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messageService.success(response.message);
          this.loadUsers();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler');
          this.messageService.error(errorMsg);
        }
      });
  }

  deleteUser(user: UserWithDeviceCount): void {
    if (!confirm(`ACHTUNG: ${user.first_name} ${user.last_name} und ALLE Geräte (${user.device_count}) löschen?`)) {
      return;
    }

    this.userService.deleteUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.success('Benutzer gelöscht');
          this.loadUsers();
          this.loadDevices();
        },
        error: (error) => {
          const errorMsg = this.messageService.extractErrorMessage(error, 'Fehler');
          this.messageService.error(errorMsg);
        }
      });
  }

  testEmailConnection(): void {
    this.isTestingEmail = true;
    this.emailTestResult = 'Teste Verbindung...';

    this.userService.testEmailConnection()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isTestingEmail = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.emailTestResult = response.success ? '✅ Verbindung erfolgreich!' : '❌ Verbindung fehlgeschlagen';
          if (response.success) {
            this.messageService.success('Email-Verbindung erfolgreich!');
          } else {
            this.messageService.error('Email-Verbindung fehlgeschlagen');
          }
        },
        error: (error) => {
          this.emailTestResult = '❌ Fehler: ' + (error.error?.error || error.message);
          this.messageService.error('Email-Verbindungstest fehlgeschlagen');
        }
      });
  }

  sendTestEmail(): void {
    if (!this.testEmailAddress || !this.testEmailAddress.includes('@')) {
      this.messageService.error('Bitte gültige Email-Adresse eingeben');
      return;
    }

    this.isTestingEmail = true;
    this.emailTestResult = 'Sende Test-Email...';

    this.userService.sendTestEmail(this.testEmailAddress)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isTestingEmail = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.emailTestResult = '✅ Test-Email gesendet! Prüfen Sie Ihr Postfach.';
          this.messageService.success('Test-Email erfolgreich gesendet');
        },
        error: (error) => {
          this.emailTestResult = '❌ Fehler: ' + (error.error?.message || error.message);
          this.messageService.error('Fehler beim Senden');
        }
      });
  }

  getNextDueDate(device: DeviceWithUser): Date {
    return this.deviceService.calculateNextDueDate(device.last_packed, device.reminder_interval);
  }

  getDaysUntilDue(device: DeviceWithUser): number {
    return this.deviceService.daysUntilDue(device.last_packed, device.reminder_interval);
  }

  isOverdue(device: DeviceWithUser): boolean {
    return this.deviceService.isOverdue(device.last_packed, device.reminder_interval);
  }

  getStatusClass(device: DeviceWithUser): string {
    const days = this.getDaysUntilDue(device);
    if (days < 0) return 'status-overdue';
    if (days <= 30) return 'status-warning';
    return 'status-ok';
  }

  getStatusText(device: DeviceWithUser): string {
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

  goToUserDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
