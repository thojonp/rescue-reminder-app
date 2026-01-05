import { Router } from 'express';
import db from '../config/database';
import { Device, DeviceWithUser } from '../models/Device';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Alle Geräte für eingeloggten Benutzer
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const sql = 'SELECT * FROM devices WHERE user_id = ? ORDER BY last_packed DESC';

  db.all(sql, [req.user!.id], (err, rows: Device[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Alle Geräte aller Benutzer (nur Admin)
router.get('/all', authenticateToken, isAdmin, (req: AuthRequest, res) => {
  const sql = `
    SELECT d.*, u.email as user_email, u.first_name as user_first_name, 
           u.last_name as user_last_name, u.is_active as user_is_active
    FROM devices d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.last_packed DESC
  `;

  db.all(sql, [], (err, rows: DeviceWithUser[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Geräte eines bestimmten Benutzers (nur Admin)
router.get('/user/:userId', authenticateToken, isAdmin, (req: AuthRequest, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT d.*, u.email as user_email, u.first_name as user_first_name, 
           u.last_name as user_last_name, u.is_active as user_is_active
    FROM devices d
    JOIN users u ON d.user_id = u.id
    WHERE d.user_id = ?
    ORDER BY d.last_packed DESC
  `;

  db.all(sql, [userId], (err, rows: DeviceWithUser[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Neues Gerät hinzufügen
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { name, serial_number, notes, last_packed, reminder_interval, reminder_enabled } = req.body;

  if (!name || !last_packed || !reminder_interval) {
    return res.status(400).json({ error: 'Name, Packdatum und Intervall sind erforderlich' });
  }

  if (!['6', '9', '12'].includes(reminder_interval)) {
    return res.status(400).json({ 
      error: 'Erinnerungsintervall muss 6, 9 oder 12 Monate sein' 
    });
  }

  const sql = `INSERT INTO devices (user_id, device_name, serial_number, notes, last_packed, 
                                     reminder_interval, reminder_enabled) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const reminderEnabledValue = reminder_enabled === false ? 0 : 1;

  db.run(sql, [
    req.user!.id, 
    name, 
    serial_number || null, 
    notes || null, 
    last_packed, 
    reminder_interval,
    reminderEnabledValue
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      message: 'Gerät erfolgreich hinzugefügt'
    });
  });
});

// Gerät aktualisieren (Benutzer kann nur eigene, Admin kann alle)
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { name, serial_number, notes, last_packed, reminder_interval, reminder_enabled } = req.body;
  const deviceId = req.params.id;

  if (!name || !last_packed || !reminder_interval) {
    return res.status(400).json({ error: 'Name, Packdatum und Intervall sind erforderlich' });
  }

  if (!['6', '9', '12'].includes(reminder_interval)) {
    return res.status(400).json({ 
      error: 'Erinnerungsintervall muss 6, 9 oder 12 Monate sein' 
    });
  }

  // Prüfen ob Gerät existiert und alte Daten abrufen
  db.get(
    'SELECT * FROM devices WHERE id = ?',
    [deviceId],
    (err, device: Device | undefined) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!device) {
        return res.status(404).json({ error: 'Gerät nicht gefunden' });
      }

      // Nur Admin oder Owner darf bearbeiten
      if (!req.user!.is_admin && device.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }

      const reminderEnabledValue = reminder_enabled === false ? 0 : 1;
      
      // Prüfe ob Packdatum geändert wurde
      const packDateChanged = device.last_packed !== last_packed;
      
      let sql: string;
      let params: any[];

      if (packDateChanged) {
        // Packdatum wurde geändert -> Reminder-Flags zurücksetzen
        sql = `UPDATE devices 
               SET device_name = ?, serial_number = ?, notes = ?, last_packed = ?, 
                   reminder_interval = ?, reminder_enabled = ?,
                   first_reminder_sent = NULL, second_reminder_sent = NULL
               WHERE id = ?`;
        params = [name, serial_number || null, notes || null, last_packed, 
                  reminder_interval, reminderEnabledValue, deviceId];
      } else {
        // Packdatum unverändert -> Reminder-Flags behalten
        sql = `UPDATE devices 
               SET device_name = ?, serial_number = ?, notes = ?, last_packed = ?, 
                   reminder_interval = ?, reminder_enabled = ?
               WHERE id = ?`;
        params = [name, serial_number || null, notes || null, last_packed, 
                  reminder_interval, reminderEnabledValue, deviceId];
      }

      db.run(sql, params, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ 
          message: 'Gerät erfolgreich aktualisiert',
          reminders_reset: packDateChanged
        });
      });
    }
  );
});

// Gerät löschen (Benutzer kann nur eigene, Admin kann alle)
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const deviceId = req.params.id;

  db.get(
    'SELECT * FROM devices WHERE id = ?',
    [deviceId],
    (err, device: Device | undefined) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!device) {
        return res.status(404).json({ error: 'Gerät nicht gefunden' });
      }

      if (!req.user!.is_admin && device.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Keine Berechtigung' });
      }

      db.run('DELETE FROM devices WHERE id = ?', [deviceId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Gerät erfolgreich gelöscht' });
      });
    }
  );
});

export default router;