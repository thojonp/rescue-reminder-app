import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./rescue-reminder.db');
const runAsync = promisify(db.run.bind(db));

export async function initDatabase() {
  // Users Tabelle
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Devices Tabelle mit erweiterten Reminder-Feldern
  await runAsync(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_name TEXT NOT NULL,
      serial_number TEXT,
      notes TEXT,
      last_packed DATETIME NOT NULL,
      reminder_interval INTEGER NOT NULL DEFAULT 12,
      reminder_enabled BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      first_reminder_sent DATETIME,
      second_reminder_sent DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migration: Alte Spalten umbenennen falls sie existieren
  db.all("PRAGMA table_info(users)", [], async (err, columns: any[]) => {
    if (!err && columns) {
      const columnNames = columns.map(col => col.name);
      
      // Alte Spalten vorhanden? Migration durchführen
      if (columnNames.includes('vorname') && !columnNames.includes('first_name')) {
        console.log('Migriere users Tabelle...');
        await runAsync(`
          CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await runAsync(`
          INSERT INTO users_new (id, email, password, first_name, last_name, is_admin, is_active, created_at)
          SELECT id, email, password, vorname, name, is_admin, is_active, created_at FROM users
        `);
        
        await runAsync('DROP TABLE users');
        await runAsync('ALTER TABLE users_new RENAME TO users');
        console.log('✅ Users Tabelle migriert');
      }
      
      if (!columnNames.includes('is_active')) {
        await runAsync('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1');
        console.log('✅ Spalte is_active hinzugefügt');
      }
    }
  });

  db.all("PRAGMA table_info(devices)", [], async (err, columns: any[]) => {
    if (!err && columns) {
      const columnNames = columns.map(col => col.name);
      
      // Alte Spalten vorhanden? Migration durchführen
      if (columnNames.includes('name') && !columnNames.includes('device_name')) {
        console.log('Migriere devices Tabelle...');
        await runAsync(`
          CREATE TABLE devices_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_name TEXT NOT NULL,
            serial_number TEXT,
            notes TEXT,
            last_packed DATETIME NOT NULL,
            reminder_interval INTEGER NOT NULL DEFAULT 12,
            reminder_enabled BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            first_reminder_sent DATETIME,
            second_reminder_sent DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        
        // Alte Spalte 'last_reminder' zu 'first_reminder_sent' migrieren
        await runAsync(`
          INSERT INTO devices_new (id, user_id, device_name, serial_number, notes, last_packed, 
                                   reminder_interval, reminder_enabled, created_at, first_reminder_sent)
          SELECT id, user_id, name, serial_number, notes, last_packed, 
                 reminder_interval, 
                 COALESCE(reminder_enabled, 1),
                 created_at, last_reminder FROM devices
        `);
        
        await runAsync('DROP TABLE devices');
        await runAsync('ALTER TABLE devices_new RENAME TO devices');
        console.log('✅ Devices Tabelle migriert');
      } else {
        // Neue Spalten hinzufügen falls Tabelle schon existiert
        if (!columnNames.includes('serial_number')) {
          await runAsync('ALTER TABLE devices ADD COLUMN serial_number TEXT');
        }
        if (!columnNames.includes('notes')) {
          await runAsync('ALTER TABLE devices ADD COLUMN notes TEXT');
        }
        if (!columnNames.includes('reminder_enabled')) {
          await runAsync('ALTER TABLE devices ADD COLUMN reminder_enabled BOOLEAN DEFAULT 1');
        }
        if (!columnNames.includes('first_reminder_sent')) {
          await runAsync('ALTER TABLE devices ADD COLUMN first_reminder_sent DATETIME');
        }
        if (!columnNames.includes('second_reminder_sent')) {
          await runAsync('ALTER TABLE devices ADD COLUMN second_reminder_sent DATETIME');
        }
      }
    }
  });

  // Standard Admin erstellen
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  db.run(
    `INSERT OR IGNORE INTO users (email, password, first_name, last_name, is_admin, is_active) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['admin@rescue.com', hashedPassword, 'Admin', 'User', 1, 1],
    (err) => {
      if (err && !err.message.includes('UNIQUE')) {
        console.error('Fehler beim Erstellen des Admin-Users:', err);
      }
    }
  );

  console.log('✅ Datenbank initialisiert');
  console.log('🔐 Standard Admin: admin@rescue.com / admin123');
}

export default db;