import { Router } from 'express';
import db from '../config/database';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import { sendTestEmail, testEmailConnection } from '../services/emailService';

const router = Router();

// Debug-Endpoint: Zeigt aktuellen User und Token-Info
router.get('/whoami', authenticateToken, (req: AuthRequest, res) => {
  const sql = 'SELECT id, email, first_name, last_name, is_admin, is_active FROM users WHERE id = ?';
  
  db.get(sql, [req.user!.id], (err, user: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      token_data: req.user,
      database_user: user,
      matches: {
        id: req.user!.id === user?.id,
        is_admin_token: req.user!.is_admin,
        is_admin_db: user?.is_admin,
        is_admin_matches: req.user!.is_admin === (user?.is_admin ? true : false)
      }
    });
  });
});

// Debug-Endpoint: Liste aller User mit Admin-Status
router.get('/users', (req, res) => {
  const sql = 'SELECT id, email, first_name, last_name, is_admin, is_active FROM users';
  
  db.all(sql, [], (err, users: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      users: users.map(u => ({
        ...u,
        is_admin: u.is_admin ? true : false,
        is_active: u.is_active ? true : false
      }))
    });
  });
});

// Test Email-Verbindung (nur Admin)
router.get('/test-email-connection', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const connected = await testEmailConnection();
    res.json({
      success: connected,
      message: connected ? 'Email-Server erfolgreich verbunden' : 'Verbindung zum Email-Server fehlgeschlagen'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Testen der Email-Verbindung',
      error: error.message
    });
  }
});

// Test-Email senden (nur Admin)
router.post('/send-test-email', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email-Adresse ist erforderlich' });
  }

  try {
    await sendTestEmail(email, 'Rettungsgerät Management System');
    res.json({
      success: true,
      message: `Test-Email erfolgreich an ${email} gesendet`
    });
  } catch (error: any) {
    console.error('Test-Email Fehler:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Senden der Test-Email',
      error: error.message
    });
  }
});

export default router;