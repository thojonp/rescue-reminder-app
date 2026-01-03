import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';
import { UserService } from '../../services/user.service';
import { Device, DeviceFormData } from '../../models/device.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  currentUser: User | null = null;
  devices: Device[] = [];
  showAddForm = false;
  showAccountSettings = false;
  editingDevice: Device | null = null;
  newEmail = '';

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

  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;
  isLoadingDevices = true;

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.newEmail = user.email;
      }
    });
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoadingDevices = true;
    
    this.deviceService.getMyDevices().subscribe({
      next: (devices) => {
        this.devices = [...devices];
        this.isLoadingDevices = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showMessage('Fehler beim Laden der Geräte', 'error');
        this.isLoadingDevices = false;
        this.devices = [];
        this.cdr.detectChanges();
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
      this.showMessage('Name und Packdatum sind erforderlich', 'error');
      return;
    }

    this.isLoading = true;

    if (this.editingDevice) {
      this.deviceService.updateDevice(this.editingDevice.id!, this.deviceForm).subscribe({
        next: () => {
          this.showMessage('Gerät erfolgreich aktualisiert', 'success');
          this.isLoading = false;
          this.closeForm();
          this.loadDevices();
        },
        error: (error) => {
          this.showMessage(error.error?.error || 'Fehler beim Aktualisieren', 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.deviceService.createDevice(this.deviceForm).subscribe({
        next: () => {
          this.showMessage('Gerät erfolgreich hinzugefügt', 'success');
          this.isLoading = false;
          this.closeForm();
          this.loadDevices();
        },
        error: (error) => {
          this.showMessage(error.error?.error || 'Fehler beim Hinzufügen', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  deleteDevice(device: Device): void {
    if (!confirm(`Möchten Sie "${device.device_name}" wirklich löschen?`)) {
      return;
    }

    this.deviceService.deleteDevice(device.id!).subscribe({
      next: () => {
        this.showMessage('Gerät erfolgreich gelöscht', 'success');
        this.loadDevices();
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Löschen', 'error');
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
      this.showMessage('Bitte gültige Email-Adresse eingeben', 'error');
      return;
    }

    this.userService.updateMyEmail(this.newEmail).subscribe({
      next: () => {
        this.showMessage('Email erfolgreich aktualisiert', 'success');
        if (this.currentUser) {
          this.currentUser.email = this.newEmail;
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Aktualisieren', 'error');
      }
    });
  }

  deactivateAccount(): void {
    if (!confirm('Möchten Sie Ihr Konto wirklich deaktivieren?')) {
      return;
    }

    this.userService.deactivateMyAccount().subscribe({
      next: () => {
        alert('Ihr Konto wurde deaktiviert.');
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler', 'error');
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('ACHTUNG: Konto und ALLE Geräte löschen?')) {
      return;
    }

    this.userService.deleteMyAccount().subscribe({
      next: () => {
        alert('Ihr Konto wurde gelöscht.');
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler', 'error');
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

  showMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}