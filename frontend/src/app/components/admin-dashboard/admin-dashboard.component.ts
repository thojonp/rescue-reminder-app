import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';
import { UserService } from '../../services/user.service';
import { UserWithDeviceCount } from '../../models/user.model';
import { DeviceWithUser, DeviceFormData } from '../../models/device.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: UserWithDeviceCount[] = [];
  devices: DeviceWithUser[] = [];
  filteredDevices: DeviceWithUser[] = [];
  activeTab: 'users' | 'devices' = 'devices';
  selectedUserId: number | null = null;
  showEditDeviceModal = false;
  showUserDevicesModal = false;
  editingDevice: DeviceWithUser | null = null;
  
  deviceForm: DeviceFormData = {
    name: '',
    serial_number: '',
    notes: '',
    last_packed: '',
    reminder_interval: 12,
    reminder_enabled: true
  };

  reminderIntervals = [
    { value: 6, label: '6 Monate' },
    { value: 9, label: '9 Monate' },
    { value: 12, label: '12 Monate' }
  ];

  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;
  isLoadingUsers = true;
  isLoadingDevices = true;

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Admin Dashboard initialisiert');
    this.loadUsers();
    this.loadDevices();
  }

  loadUsers(): void {
    console.log('Lade Benutzer...');
    this.isLoadingUsers = true;
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Benutzer geladen:', users.length);
        this.users = [...users];
        this.isLoadingUsers = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Fehler beim Laden der Benutzer:', error);
        this.showMessage('Fehler beim Laden der Benutzer', 'error');
        this.isLoadingUsers = false;
        this.users = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadDevices(): void {
    console.log('Lade Geräte...');
    this.isLoadingDevices = true;
    
    this.deviceService.getAllDevices().subscribe({
      next: (devices) => {
        console.log('✅ Geräte geladen:', devices.length);
        this.devices = [...devices];
        this.filteredDevices = [...devices];
        this.isLoadingDevices = false;
        this.cdr.detectChanges();
        console.log('View aktualisiert, Anzahl Geräte:', this.devices.length);
      },
      error: (error) => {
        console.error('❌ Fehler beim Laden der Geräte:', error);
        this.showMessage('Fehler beim Laden der Geräte', 'error');
        this.isLoadingDevices = false;
        this.devices = [];
        this.filteredDevices = [];
        this.cdr.detectChanges();
      }
    });
  }

  switchTab(tab: 'users' | 'devices'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  filterByUser(userId: number | null): void {
    console.log('Filter nach Benutzer:', userId);
    this.selectedUserId = userId;
    if (userId === null) {
      this.filteredDevices = [...this.devices];
    } else {
      this.filteredDevices = this.devices.filter(d => d.user_id === userId);
    }
    console.log('Gefilterte Geräte:', this.filteredDevices.length);
    this.cdr.detectChanges();
  }

  viewUserDevices(user: UserWithDeviceCount): void {
    this.selectedUserId = user.id;
    this.filterByUser(user.id);
    this.showUserDevicesModal = true;
    this.cdr.detectChanges();
  }

  closeUserDevicesModal(): void {
    this.showUserDevicesModal = false;
    this.selectedUserId = null;
    this.filterByUser(null);
    this.cdr.detectChanges();
  }

  openEditDevice(device: DeviceWithUser): void {
    this.editingDevice = device;
    this.showEditDeviceModal = true;
    this.deviceForm = {
      name: device.name,
      serial_number: device.serial_number || '',
      notes: device.notes || '',
      last_packed: device.last_packed.split('T')[0],
      reminder_interval: device.reminder_interval,
      reminder_enabled: device.reminder_enabled
    };
    this.cdr.detectChanges();
  }

  closeEditDeviceModal(): void {
    this.showEditDeviceModal = false;
    this.editingDevice = null;
    this.cdr.detectChanges();
  }

  onUpdateDevice(): void {
    if (!this.editingDevice || !this.deviceForm.name || !this.deviceForm.last_packed) {
      this.showMessage('Name und Packdatum sind erforderlich', 'error');
      return;
    }

    this.isLoading = true;

    this.deviceService.updateDevice(this.editingDevice.id!, this.deviceForm).subscribe({
      next: () => {
        this.showMessage('Gerät erfolgreich aktualisiert', 'success');
        this.isLoading = false;
        this.closeEditDeviceModal();
        this.loadDevices();
        if (this.selectedUserId) {
          setTimeout(() => this.filterByUser(this.selectedUserId), 100);
        }
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Aktualisieren', 'error');
        this.isLoading = false;
      }
    });
  }

  deleteDevice(device: DeviceWithUser): void {
    const userName = `${device.user_vorname} ${device.user_name}`;
    if (!confirm(`Möchten Sie "${device.name}" von Benutzer ${userName} wirklich löschen?`)) {
      return;
    }

    this.deviceService.deleteDevice(device.id!).subscribe({
      next: () => {
        this.showMessage('Gerät erfolgreich gelöscht', 'success');
        this.loadDevices();
        if (this.selectedUserId) {
          setTimeout(() => this.filterByUser(this.selectedUserId), 100);
        }
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Löschen', 'error');
      }
    });
  }

  toggleUserActive(user: UserWithDeviceCount): void {
    const action = user.is_active ? 'deaktivieren' : 'aktivieren';
    if (!confirm(`Möchten Sie den Benutzer ${user.vorname} ${user.name} wirklich ${action}?`)) {
      return;
    }

    this.userService.toggleUserActive(user.id).subscribe({
      next: (response) => {
        this.showMessage(response.message, 'success');
        this.loadUsers();
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Aktualisieren', 'error');
      }
    });
  }

  deleteUser(user: UserWithDeviceCount): void {
    if (!confirm(`ACHTUNG: Möchten Sie den Benutzer ${user.vorname} ${user.name} und ALLE zugehörigen Geräte (${user.device_count}) wirklich löschen?`)) {
      return;
    }

    if (!confirm('Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?')) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.showMessage('Benutzer und alle Geräte erfolgreich gelöscht', 'success');
        this.loadUsers();
        this.loadDevices();
      },
      error: (error) => {
        this.showMessage(error.error?.error || 'Fehler beim Löschen', 'error');
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

  getTotalDevices(): number {
    return this.devices.length;
  }

  getActiveDevices(): number {
    return this.devices.filter(d => d.reminder_enabled && d.user_is_active).length;
  }

  getOverdueDevices(): number {
    return this.devices.filter(d => this.isOverdue(d)).length;
  }

  getUpcomingDevices(): number {
    return this.devices.filter(d => {
      const days = this.getDaysUntilDue(d);
      return days >= 0 && days <= 30;
    }).length;
  }

  getActiveUsers(): number {
    return this.users.filter(u => u.is_active).length;
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

  goToUserDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}