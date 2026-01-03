import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// WICHTIG: In Produktion durch Umgebungsvariable ersetzen!
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    is_admin: boolean;
  };
}

export function authenticateToken(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiger Token' });
    }
    req.user = user;
    next();
  });
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
  }
  next();
}

export { JWT_SECRET };
