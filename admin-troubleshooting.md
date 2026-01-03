# 🔧 Admin-Problem Lösung

## Problem: Admin sieht nicht alle Geräte

### Ursache:
Der `is_admin` Status wird entweder nicht korrekt in der Datenbank gespeichert oder nicht korrekt vom Backend zum Frontend übertragen.

---

## ✅ Lösung: Schritt-für-Schritt

### Schritt 1: Backend-Dateien aktualisieren

Ersetze folgende Dateien:
1. `backend/src/routes/auth.ts` - Verbesserte Login-Logik mit Logging
2. `backend/src/server.ts` - Debug-Routes hinzugefügt
3. Erstelle NEU: `backend/src/routes/debug.ts` - Debug-Endpoints

### Schritt 2: Frontend-Dateien aktualisieren

Ersetze folgende Dateien:
1. `frontend/src/app/services/auth.service.ts` - Verbessertes Logging
2. `frontend/src/app/components/login/login.component.ts` - Besseres Redirect-Handling

### Schritt 3: Admin-Status in Datenbank prüfen

**Option A: Mit dem Check-Script**

1. Erstelle `backend/check-admin.js` (siehe Artifact)
2. Ausführen im backend-Ordner:
```bash
cd backend
node check-admin.js
```

Das zeigt alle Benutzer und deren Admin-Status.

**Option B: Direkt in der Datenbank**

```bash
cd backend
sqlite3 rescue-reminder.db
```

```sql
-- Alle Benutzer anzeigen
SELECT id, email, vorname, name, is_admin, is_active FROM users;

-- Admin-Status setzen
UPDATE users SET is_admin = 1 WHERE email = 'admin@rescue.com';

-- Prüfen
SELECT email, is_admin FROM users WHERE email = 'admin@rescue.com';

-- Beenden
.quit
```

### Schritt 4: Admin-Status setzen

**Mit dem Script:**
```bash
node check-admin.js set admin@rescue.com
```

**Oder manuell in SQLite:**
```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@rescue.com';
```

### Schritt 5: Server neu starten

```bash
# Backend neu starten
cd backend
npm run dev
```

### Schritt 6: Frontend testen

1. **Ausloggen** falls bereits eingeloggt
2. **Neu einloggen** mit admin@rescue.com / admin123
3. **Browser-Konsole öffnen** (F12)
4. Schaue nach folgenden Log-Einträgen:
   ```
   Login erfolgreich, User: {...}
   is_admin: true
   Redirect zu Admin-Dashboard
   ```

---

## 🔍 Debug-Endpoints verwenden

Nach dem Start des Backends kannst du folgende URLs im Browser oder mit curl testen:

### 1. Wer bin ich? (Benötigt Login)
```bash
# Erst einloggen und Token kopieren
curl http://localhost:3000/api/debug/whoami \
  -H "Authorization: Bearer DEIN_TOKEN_HIER"
```

Zeigt:
- Token-Daten
- Datenbank-Daten
- Ob sie übereinstimmen

### 2. Alle Benutzer anzeigen (Ohne Login)
```bash
curl http://localhost:3000/api/debug/users
```

Zeigt alle Benutzer mit Admin-Status.

---

## 🔎 Fehlersuche Checkliste

### Problem: "Alle Geräte" Tab ist leer

✅ **Checkliste:**
1. [ ] Backend läuft ohne Fehler?
2. [ ] Browser-Konsole (F12) geöffnet und Fehler geprüft?
3. [ ] `is_admin` in Datenbank = 1?
4. [ ] Nach Admin-Änderung neu eingeloggt?
5. [ ] Token enthält `is_admin: true`?
6. [ ] API-Call zu `/api/devices/all` erfolgreich?

### Problem: Redirect zum falschen Dashboard

**Symptom:** Admin wird zu User-Dashboard geleitet

**Prüfen:**
1. Browser-Konsole: Steht dort `is_admin: true`?
2. LocalStorage prüfen (F12 → Application → Local Storage):
   - `currentUser` sollte `"is_admin":true` enthalten

**Lösung:**
```javascript
// In Browser-Konsole ausführen
console.log(JSON.parse(localStorage.getItem('currentUser')));
// Sollte zeigen: { ..., is_admin: true, ... }
```

Falls `is_admin: false` → Neu einloggen nach DB-Update!

### Problem: 403 Forbidden bei /api/devices/all

**Ursache:** Token enthält `is_admin: false`

**Lösung:**
1. Datenbank-Admin-Status prüfen (siehe Schritt 3)
2. Ausloggen
3. Backend neu starten
4. Neu einloggen

---

## 🛠️ Schnelle Fixes

### Fix 1: Admin direkt in DB setzen
```bash
cd backend
sqlite3 rescue-reminder.db "UPDATE users SET is_admin = 1 WHERE email = 'admin@rescue.com';"
sqlite3 rescue-reminder.db "SELECT email, is_admin FROM users;"
```

### Fix 2: Neuen Admin-User erstellen
```bash
cd backend
sqlite3 rescue-reminder.db
```

```sql
INSERT INTO users (email, password, vorname, name, is_admin, is_active) 
VALUES (
  'superadmin@rescue.com',
  '$2b$10$YourHashedPasswordHere',
  'Super',
  'Admin',
  1,
  1
);
```

**Hinweis:** Passwort muss gehasht sein. Besser: Über `/api/auth/register` registrieren und dann Admin-Status setzen.

### Fix 3: Browser-Cache leeren
1. F12 → Application → Local Storage → localhost:4200
2. Alles löschen
3. Neu einloggen

---

## 📊 Erwartete Ausgaben

### ✅ Korrekter Login (Admin)

**Backend-Konsole:**
```
Login erfolgreich: {
  id: 1,
  email: 'admin@rescue.com',
  is_admin: 1,
  token_payload: { id: 1, email: 'admin@rescue.com', is_admin: true }
}
```

**Browser-Konsole:**
```
Login Response: { token: "...", user: { ..., is_admin: true } }
User is_admin: true
User gespeichert: { id: 1, email: "admin@rescue.com", is_admin: true, ... }
is_admin Status: true
Redirect zu Admin-Dashboard
```

### ❌ Falscher Status (User statt Admin)

**Browser-Konsole:**
```
is_admin: false
Redirect zu User-Dashboard
```

**Problem:** Datenbank hat `is_admin = 0` → Siehe Fix 1

---

## 🎯 Zusammenfassung

**Die Hauptursachen sind meistens:**
1. ❌ `is_admin` in DB ist 0 statt 1
2. ❌ Alter Token im Browser (vor DB-Änderung)
3. ❌ Backend nicht neu gestartet nach Code-Änderung
4. ❌ Browser-Cache mit alten Daten

**Die Lösung:**
1. ✅ Admin-Status in DB auf 1 setzen
2. ✅ Backend neu starten
3. ✅ Ausloggen + Browser-Cache leeren
4. ✅ Neu einloggen
5. ✅ Browser-Konsole prüfen

---

## 📞 Weitere Hilfe

Falls das Problem weiterhin besteht:

1. **Backend-Konsole** Screenshot machen beim Login
2. **Browser-Konsole** (F12) Screenshot machen
3. **Debug-Endpoint** aufrufen:
   ```bash
   curl http://localhost:3000/api/debug/users
   ```
4. **LocalStorage** Inhalt prüfen (F12 → Application)

Mit diesen Informationen kann das Problem schnell identifiziert werden! 🚀
