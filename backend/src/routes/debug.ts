import { Router } from 'express';
import db from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Debug-Endpoint: Zeigt aktuellen User und Token-Info
router.get('/whoami', authenticateToken, (req: AuthRequest, res) => {
  const sql = 'SELECT id, email, vorname, name, is_admin, is_active FROM users WHERE id = ?';
  
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
  const sql = 'SELECT id, email, vorname, name, is_admin, is_active FROM users';
  
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

export default router;
