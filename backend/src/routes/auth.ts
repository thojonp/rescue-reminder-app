import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { User } from '../models/User';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

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

    // Prüfe ob Benutzer aktiv ist
    if (!user.is_active) {
      return res.status(403).json({ error: 'Ihr Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator.' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password!);

      if (!validPassword) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // WICHTIG: is_admin aus der Datenbank verwenden
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          is_admin: user.is_admin ? true : false  // Explizit zu boolean konvertieren
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('Login erfolgreich:', {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        token_payload: { id: user.id, email: user.email, is_admin: user.is_admin }
      });

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

export default router;