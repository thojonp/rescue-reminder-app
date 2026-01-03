import { Router } from 'express';
import db from '../config/database';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import { UserResponse, UserWithDeviceCount } from '../models/User';

const router = Router();

// Alle Benutzer abrufen (nur Admin)
router.get('/', authenticateToken, isAdmin, (req: AuthRequest, res) => {
  const sql = `
    SELECT u.id, u.email, u.vorname, u.name, u.is_admin, u.is_active, u.created_at,
           COUNT(d.id) as device_count
    FROM users u
    LEFT JOIN devices d ON u.id = d.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  db.all(sql, [], (err, rows: UserWithDeviceCount[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Aktuellen Benutzer abrufen
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const sql = 'SELECT id, email, vorname, name, is_admin, is_active FROM users WHERE id = ?';

  db.get(sql, [req.user!.id], (err, user: UserResponse | undefined) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  });
});

// Benutzer deaktivieren (User kann sich selbst deaktivieren)
router.put('/deactivate', authenticateToken, (req: AuthRequest, res) => {
  const sql = 'UPDATE users SET is_active = 0 WHERE id = ?';

  db.run(sql, [req.user!.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({ message: 'Konto erfolgreich deaktiviert' });
  });
});

// Benutzer und alle Geräte löschen (User kann sich selbst löschen)
router.delete('/me', authenticateToken, (req: AuthRequest, res) => {
  // Erst alle Geräte löschen
  db.run('DELETE FROM devices WHERE user_id = ?', [req.user!.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Dann Benutzer löschen
    db.run('DELETE FROM users WHERE id = ?', [req.user!.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      res.json({ message: 'Konto und alle Geräte erfolgreich gelöscht' });
    });
  });
});

// Admin: Benutzer löschen (inklusive Geräte)
router.delete('/:id', authenticateToken, isAdmin, (req: AuthRequest, res) => {
  const userId = req.params.id;

  // Admin kann sich nicht selbst löschen
  if (parseInt(userId) === req.user!.id) {
    return res.status(400).json({ error: 'Sie können Ihr eigenes Admin-Konto nicht löschen' });
  }

  // Erst alle Geräte des Benutzers löschen
  db.run('DELETE FROM devices WHERE user_id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Dann Benutzer löschen
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }

      res.json({ message: 'Benutzer und alle zugehörigen Geräte erfolgreich gelöscht' });
    });
  });
});

// Admin: Benutzer aktivieren/deaktivieren
router.put('/:id/toggle-active', authenticateToken, isAdmin, (req: AuthRequest, res) => {
  const userId = req.params.id;

  // Admin kann sich nicht selbst deaktivieren
  if (parseInt(userId) === req.user!.id) {
    return res.status(400).json({ error: 'Sie können Ihr eigenes Admin-Konto nicht deaktivieren' });
  }

  // Aktuellen Status holen
  db.get('SELECT is_active FROM users WHERE id = ?', [userId], (err, user: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Status umkehren
    const newStatus = user.is_active ? 0 : 1;

    db.run('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ 
        message: newStatus ? 'Benutzer aktiviert' : 'Benutzer deaktiviert',
        is_active: newStatus
      });
    });
  });
});

export default router;