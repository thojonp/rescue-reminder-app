# 🚨 Rettungsgerät Management System v2.0

Ein vollständiges Verwaltungssystem für Rettungsgeräte mit automatischen Email-Erinnerungen, Admin-Verwaltung und erweiterten Features.

## 🆕 Neue Features in v2.0

- ✅ **Seriennummer** für jedes Gerät
- ✅ **Notizfeld** für zusätzliche Informationen
- ✅ **Individuell aktivierbare/deaktivierbare Erinnerungen** pro Gerät
- ✅ **Admin kann alle Geräte sehen und bearbeiten**
- ✅ **Admin kann Geräte nach Benutzer filtern**
- ✅ **Benutzer können ihr Konto selbst deaktivieren/löschen**
- ✅ **Admin kann Benutzer und deren Geräte verwalten**
- ✅ **Aktiv/Inaktiv Status** für Benutzer
- ✅ **Erweiterte Statistiken** im Admin-Dashboard

## 📋 Features

### Für alle Benutzer:
- Benutzer-Authentifizierung (Login/Registrierung)
- Mehrere Geräte pro Benutzer verwalten
- Individuelles Packdatum und Erinnerungsintervall (6, 9 oder 12 Monate)
- Seriennummer und Notizen pro Gerät
- Erinnerungen pro Gerät aktivieren/deaktivieren
- Status-Tracking (OK, Bald fällig, Überfällig)
- Konto-Verwaltung (Deaktivieren/Löschen)

### Für Administratoren:
- Dashboard mit Übersicht aller Benutzer und Geräte
- Statistiken (Aktive Benutzer, Geräte, Überfällige, etc.)
- Alle Geräte nach Benutzer filtern
- Geräte von Benutzern bearbeiten und löschen
- Benutzer aktivieren/deaktivieren
- Benutzer und alle zugehörigen Geräte löschen
- Detailansicht der Geräte pro Benutzer

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- SQLite Datenbank
- JWT Authentication
- Nodemailer für Emails
- node-cron für Scheduler

**Frontend:**
- Angular 18 (Standalone Components)
- TypeScript
- Reactive Forms
- HTTP Interceptors
- Route Guards

## 📦 Installation

### Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn
- Angular CLI (`npm install -g @angular/cli`)

### 1. Projekt-Setup

```bash
mkdir rescue-reminder-app
cd rescue-reminder-app
```

### 2. Backend Setup

```bash
mkdir backend
cd backend

# Dependencies installieren
npm install express cors sqlite3 nodemailer node-cron bcrypt jsonwebtoken

# Dev-Dependencies installieren
npm install -D typescript ts-node-dev @types/express @types/cors @types/node @types/nodemailer @types/node-cron @types/bcrypt @types/jsonwebtoken

# Ordnerstruktur erstellen
mkdir -p src/config src/models src/middleware src/routes src/services src/jobs
```

**Backend-Dateien kopieren:**
- `package.json`
- `tsconfig.json`
- `src/server.ts`
- `src/config/database.ts`
- `src/models/User.ts`
- `src/models/Device.ts`
- `src/middleware/auth.ts`
- `src/routes/auth.ts`
- `src/routes/users.ts`
- `src/routes/devices.ts`
- `src/services/emailService.ts`
- `src/jobs/reminderJob.ts`

**⚠️ WICHTIG: Email-Konfiguration**

Bearbeite `src/services/emailService.ts`:

```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'deine-email@gmail.com',     // ← Hier ändern
    pass: 'dein-app-passwort'          // ← Hier ändern
  }
});
```

**Für Gmail:**
1. Google-Konto → Sicherheit
2. 2-Faktor-Authentifizierung aktivieren
3. App-Passwort erstellen für "Mail"
4. Email und App-Passwort eintragen

### 3. Frontend Setup

```bash
cd ..
npx @angular/cli new frontend --routing --style=css --standalone
cd frontend
```

**Frontend-Dateien kopieren:**

**Models:**
- `src/app/models/user.model.ts`
- `src/app/models/device.model.ts`

**Services:**
- `src/app/services/auth.service.ts`
- `src/app/services/device.service.ts`
- `src/app/services/user.service.ts` ← NEU!

**Guards:**
- `src/app/guards/auth.guard.ts`
- `src/app/guards/admin.guard.ts`

**Interceptors:**
- `src/app/interceptors/auth.interceptor.ts`

**Components:**
- `src/app/components/login/*` (ts, html, css)
- `src/app/components/register/*` (ts, html, css)
- `src/app/components/user-dashboard/*` (ts, html, css)
- `src/app/components/admin-dashboard/*` (ts, html, css)

**Config:**
- `src/app/app.routes.ts`
- `src/app/app.config.ts`
- `src/app/app.component.ts`
- `src/main.ts`
- `src/styles.css`

## 🚀 Starten

### Backend starten

```bash
cd backend
npm run dev
```

Server läuft auf: `http://localhost:3000`

### Frontend starten

```bash
cd frontend
npm start
```

App läuft auf: `http://localhost:4200`

## 🔐 Standard-Login

**Admin-Zugang:**
- Email: `admin@rescue.com`
- Passwort: `admin123`

## 📊 Datenbank-Schema

### Users Tabelle
```sql
- id: INTEGER PRIMARY KEY
- email: TEXT UNIQUE
- password: TEXT (hashed)
- first_name: TEXT
- last_name: TEXT
- is_admin: BOOLEAN
- is_active: BOOLEAN (NEU)
- created_at: DATETIME
```

### Devices Tabelle
```sql
- id: INTEGER PRIMARY KEY
- user_id: INTEGER (Foreign Key)
- name: TEXT
- serial_number: TEXT (NEU)
- notes: TEXT (NEU)
- last_packed: DATETIME
- reminder_interval: INTEGER (6, 9, oder 12)
- reminder_enabled: BOOLEAN (NEU)
- created_at: DATETIME
- last_reminder: DATETIME
```

## 🎯 Benutzerrollen

### Normal User
- Eigene Geräte verwalten (Erstellen, Bearbeiten, Löschen)
- Seriennummer und Notizen hinzufügen
- Erinnerungen pro Gerät aktivieren/deaktivieren
- Eigenes Konto deaktivieren oder löschen
- Alle eigenen Geräte werden bei Kontolöschung gelöscht

### Administrator
- Alle Benutzer und Geräte sehen
- Geräte nach Benutzer filtern
- Beliebige Geräte bearbeiten und löschen
- Benutzer aktivieren/deaktivieren
- Benutzer und alle zugehörigen Geräte löschen
- Statistiken und Übersichten
- Zugriff auf eigenes Benutzer-Dashboard

## 📧 Email-Erinnerungen

### Funktion:
- Läuft täglich um 9:00 Uhr (anpassbar)
- Prüft alle Geräte mit aktivierter Erinnerung
- Berücksichtigt nur aktive Benutzer
- Sendet Email wenn Fälligkeitsdatum erreicht ist
- Email enthält: Gerätename, Packdatum, nächste Überprüfung

### Deaktivierung:
- Pro Gerät individuell deaktivierbar
- Deaktivierte Benutzer erhalten keine Emails
- Kein Spam - nur bei Fälligkeit

## 📝 API-Endpoints

### Authentication
- `POST /api/auth/register` - Neuen Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden

### Users
- `GET /api/users` - Alle Benutzer (Admin)
- `GET /api/users/me` - Aktueller Benutzer
- `PUT /api/users/deactivate` - Eigenes Konto deaktivieren
- `DELETE /api/users/me` - Eigenes Konto löschen
- `DELETE /api/users/:id` - Benutzer löschen (Admin)
- `PUT /api/users/:id/toggle-active` - Benutzer aktivieren/deaktivieren (Admin)

### Devices
- `GET /api/devices` - Eigene Geräte
- `GET /api/devices/all` - Alle Geräte (Admin)
- `GET /api/devices/user/:userId` - Geräte eines Benutzers (Admin)
- `POST /api/devices` - Neues Gerät erstellen
- `PUT /api/devices/:id` - Gerät aktualisieren
- `DELETE /api/devices/:id` - Gerät löschen

## 🔧 Konfiguration

### Email-Zeitplan ändern

In `backend/src/jobs/reminderJob.ts`:

```typescript
// Täglich um 9:00 Uhr
cron.schedule('0 9 * * *', async () => { ... });

// Alternativen:
// '*/5 * * * *'  → Alle 5 Minuten (zum Testen)
// '0 9 * * 1'    → Jeden Montag um 9:00 Uhr
// '0 9 1 * *'    → Am 1. jedes Monats um 9:00 Uhr
```

### JWT Secret ändern

In `backend/src/middleware/auth.ts`:

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

**Für Produktion:** Verwende Umgebungsvariablen!

## 🐛 Troubleshooting

### Backend startet nicht
- Prüfe ob Port 3000 frei ist
- `npm install` ausführen
- TypeScript-Fehler prüfen

### Frontend startet nicht
- `rm -rf node_modules && npm install`
- Angular CLI installiert? `npm install -g @angular/cli`

### Emails werden nicht gesendet
- Email-Konfiguration in `emailService.ts` prüfen
- Bei Gmail: App-Passwort verwenden
- Firewall-Einstellungen für Port 587
- Cron-Job läuft täglich um 9:00 Uhr

### Geräte werden nicht angezeigt
- Browser-Konsole (F12) öffnen und Fehler prüfen
- Netzwerk-Tab prüfen ob API-Calls erfolgreich sind
- Backend-Konsole auf Fehler prüfen

### Login funktioniert nicht
- Backend läuft? (`http://localhost:3000`)
- CORS-Konfiguration prüfen
- Token im localStorage vorhanden?

## 🔒 Sicherheit

### Produktions-Empfehlungen:
1. JWT Secret in Umgebungsvariable auslagern
2. HTTPS verwenden
3. Rate Limiting implementieren
4. Input-Validierung erweitern
5. SQL Injection Prevention (bereits durch Parameterized Queries)
6. XSS Protection (bereits durch Angular)
7. Passwort-Anforderungen verschärfen
8. Email-Verifizierung hinzufügen

## 📈 Zukünftige Erweiterungen

Mögliche Features:
- [ ] Dashboard-Widgets für User
- [ ] Export-Funktion (PDF, Excel)
- [ ] Mehrsprachigkeit (i18n)
- [ ] Mobile App (Ionic)
- [ ] Push-Benachrichtigungen
- [ ] Checklisten pro Gerät
- [ ] Foto-Upload für Geräte
- [ ] QR-Code für Geräte
- [ ] Audit-Log für Admin
- [ ] Bulk-Operations

## 📄 Lizenz

Dieses Projekt ist für private und kommerzielle Nutzung frei verfügbar.

## 👨‍💻 Support

Bei Fragen oder Problemen:
1. Backend- und Frontend-Konsole prüfen
2. Browser Developer Tools (F12) öffnen
3. Alle Dateien korrekt kopiert?
4. Email-Konfiguration angepasst?

---

**Version 2.0 - Erweitert mit Admin-Funktionen und Benutzerverwaltung** 🚀