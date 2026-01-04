import express from 'express';
import path from "path";
import cors from 'cors';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import deviceRoutes from './routes/devices';
import debugRoutes from './routes/debug';
import { startReminderJob } from './jobs/reminderJob';

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/debug', debugRoutes); // Debug-Routes

const angularDistPath = path.resolve(
  __dirname,
  "../../frontend/dist/rescue-app/browser"
);

// Static Files
app.use(express.static(angularDistPath, {
  maxAge: "1y",
  index: false, // wir liefern index.html unten gezielt aus
}));

// 3) SPA fallback (nur für nicht-API requests)
app.get("*", (req, res, next) => {
  // API nicht schlucken
  if (req.path.startsWith("/api")) return next();

  res.sendFile(path.join(angularDistPath, "index.html"));
});


async function startServer() {
  await initDatabase();
  startReminderJob();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📧 Vergiss nicht die Email-Konfiguration in services/emailService.ts anzupassen`);
    console.log(`🔍 Debug-Endpoints verfügbar unter /api/debug/whoami und /api/debug/users`);
  });
}

startServer();