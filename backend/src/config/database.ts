import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./rescue-reminder.db');
const runAsync = promisify(db.run.bind(db));

export async function initDatabase() {
  // Users Tabelle mit is_active Flag
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      vorname TEXT NOT NULL,
      name TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Devices Tabelle mit Seriennummer, Notizen und reminder_enabled
  await runAsync(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      serial_number TEXT,
      notes TEXT,
      last_packed DATETIME NOT NULL,
      reminder_interval INTEGER NOT NULL DEFAULT 12,
      reminder_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_reminder DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Prüfen ob Spalten bereits existieren, wenn nicht, hinzufügen
  db.all("PRAGMA table_info(devices)", [], async (err, columns: any[]) => {
    if (!err && columns) {
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('serial_number')) {
        await runAsync('ALTER TABLE devices ADD COLUMN serial_number TEXT');
        console.log('Spalte serial_number hinzugefügt');
      }
      
      if (!columnNames.includes('notes')) {
        await runAsync('ALTER TABLE devices ADD COLUMN notes TEXT');
        console.log('Spalte notes hinzugefügt');
      }
      
      if (!columnNames.includes('reminder_enabled')) {
        await runAsync('ALTER TABLE devices ADD COLUMN reminder_enabled BOOLEAN DEFAULT 1');
        console.log('Spalte reminder_enabled hinzugefügt');
      }
    }
  });

  db.all("PRAGMA table_info(users)", [], async (err, columns: any[]) => {
    if (!err && columns) {
      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('is_active')) {
        await runAsync('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1');
        console.log('Spalte is_active hinzugefügt');
      }
    }
  });

  // Standard Admin erstellen
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  db.run(
    `INSERT OR IGNORE INTO users (email, password, vorname, name, is_admin, is_active) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin@rescue.com', hashedPassword, 'Admin', 'User', 1, 1],
    (err) => {
      if (err) {
        console.error('Fehler beim Erstellen des Admin-Users:', err);
      }
    }
  );

  console.log('✅ Datenbank initialisiert');
  console.log('🔐 Standard Admin: admin@rescue.com / admin123');
}

export default db;