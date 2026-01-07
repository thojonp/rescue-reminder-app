import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/database';
import { User } from '../models/User';
import { JWT_SECRET } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';

const router = Router();

// Passwort-Reset-Token speichern (In-Memory - für Production besser in DB)
const resetTokens = new Map<string, { email: string; expires: Date }>();

// Registrierung
router.post('/register', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (email, password, first_name, last_name, is_admin, is_active) 
                 VALUES (?, ?, ?, ?, 0, 1)`;

    db.run(sql, [email, hashedPassword, first_name, last_name], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Email bereits registriert' });
        }
        return res.status(500).json({ error: err.message });
      }

      const token = jwt.sign(
        { id: this.lastID, email, is_admin: false },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Benutzer erfolgreich registriert',
        token,
        user: { 
          id: this.lastID, 
          email, 
          first_name: first_name, 
          last_name: last_name, 
          is_admin: false,
          is_active: true
        }
      });
    });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email und Passwort erforderlich' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.get(sql, [email], async (err, user: User | undefined) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password!);

      if (!validPassword) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          is_admin: user.is_admin ? true : false
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_admin: user.is_admin ? true : false,
          is_active: user.is_active ? true : false
        }
      });
    } catch (error) {
      console.error('Login-Fehler:', error);
      res.status(500).json({ error: 'Serverfehler beim Login' });
    }
  });
});

// Passwort zurücksetzen anfordern
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email ist erforderlich' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.get(sql, [email], async (err, user: User | undefined) => {
    if (err) {
      return res.status(500).json({ error: 'Serverfehler' });
    }

    // Aus Sicherheitsgründen immer Erfolg melden, auch wenn Email nicht existiert
    if (!user) {
      return res.json({ message: 'Falls die Email registriert ist, wurde ein Reset-Link gesendet.' });
    }

    try {
      // Reset-Token generieren
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 Stunde gültig

      // Token speichern
      resetTokens.set(resetToken, { email: user.email, expires });

      // Reset-Link generieren
      const resetLink = `https://retter.swissgliders.ch/reset-password?token=${resetToken}`;

      // Email senden
      await sendPasswordResetEmail(user.email, resetLink, `${user.first_name} ${user.last_name}`);

      res.json({ message: 'Falls die Email registriert ist, wurde ein Reset-Link gesendet.' });
    } catch (error) {
      console.error('Passwort-Reset Fehler:', error);
      res.status(500).json({ error: 'Fehler beim Senden der Email' });
    }
  });
});

// Passwort zurücksetzen
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token und neues Passwort erforderlich' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
  }

  // Token validieren
  const tokenData = resetTokens.get(token);

  if (!tokenData) {
    return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token' });
  }

  if (tokenData.expires < new Date()) {
    resetTokens.delete(token);
    return res.status(400).json({ error: 'Token ist abgelaufen' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = 'UPDATE users SET password = ? WHERE email = ?';

    db.run(sql, [hashedPassword, tokenData.email], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Zurücksetzen des Passworts' });
      }

      // Token löschen nach erfolgreicher Verwendung
      resetTokens.delete(token);

      res.json({ message: 'Passwort erfolgreich zurückgesetzt' });
    });
  } catch (error) {
    console.error('Passwort-Reset Fehler:', error);
    res.status(500).json({ error: 'Serverfehler beim Zurücksetzen' });
  }
});

// Token-Cleanup (alte Tokens löschen) - Alle 10 Minuten
setInterval(() => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expires < now) {
      resetTokens.delete(token);
    }
  }
}, 600000);

export default router;