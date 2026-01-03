import cron from 'node-cron';
import db from '../config/database';
import { sendReminderEmail } from '../services/emailService';
import { DeviceWithUser } from '../models/Device';

export function startReminderJob() {
  // Läuft täglich um 9:00 Uhr
  cron.schedule('0 9 * * *', async () => {
    console.log('🔍 Prüfe Geräte für Erinnerungen...');

    const now = new Date();

    // Nur aktive Benutzer mit aktivierten Erinnerungen
    const sql = `
      SELECT d.*, u.email, u.vorname, u.name
      FROM devices d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_active = 1 AND d.reminder_enabled = 1
    `;

    db.all(sql, [], async (err, rows: DeviceWithUser[]) => {
      if (err) {
        console.error('❌ Fehler beim Abrufen der Geräte:', err);
        return;
      }

      let sentCount = 0;
      let skippedCount = 0;

      for (const device of rows) {
        const lastPackedDate = new Date(device.last_packed);
        const dueDate = new Date(lastPackedDate);
        dueDate.setMonth(dueDate.getMonth() + device.reminder_interval);

        const shouldSendReminder = now >= dueDate && 
          (!device.last_reminder || new Date(device.last_reminder) < dueDate);

        if (shouldSendReminder) {
          try {
            await sendReminderEmail(
              device.user_email!,
              device.user_vorname!,
              device.user_name!,
              device.name,
              device.last_packed,
              device.reminder_interval
            );

            const updateSql = 'UPDATE devices SET last_reminder = ? WHERE id = ?';
            db.run(updateSql, [now.toISOString(), device.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Fehler beim Aktualisieren von Gerät ${device.id}:`, updateErr);
              }
            });

            sentCount++;
            console.log(`✅ Erinnerung gesendet für Gerät "${device.name}" an ${device.user_email}`);

          } catch (error) {
            console.error(`❌ Fehler beim Senden der Email an ${device.user_email}:`, error);
          }
        } else {
          skippedCount++;
        }
      }

      if (sentCount > 0) {
        console.log(`✅ ${sentCount} Erinnerung(en) erfolgreich gesendet`);
      }
      
      if (skippedCount > 0) {
        console.log(`ℹ️  ${skippedCount} Gerät(e) noch nicht fällig oder Erinnerung deaktiviert`);
      }
      
      if (sentCount === 0 && skippedCount === 0) {
        console.log('ℹ️  Keine Geräte mit aktivierten Erinnerungen registriert');
      }
    });
  });

  console.log('⏰ Erinnerungs-Job gestartet (täglich um 9:00 Uhr)');
  console.log('💡 Tipp: Zum Testen Zeitplan anpassen, z.B. "*/5 * * * *" für alle 5 Minuten');
}

// Optional: Manuelle Ausführung für Tests
export async function runReminderJobNow() {
  console.log('🧪 Führe Erinnerungs-Job manuell aus...');
  
  const now = new Date();
  const sql = `
    SELECT d.*, u.email, u.vorname, u.name, u.is_active
    FROM devices d
    JOIN users u ON d.user_id = u.id
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], async (err, rows: DeviceWithUser[]) => {
      if (err) {
        reject(err);
        return;
      }

      let results = [];
      
      for (const device of rows) {
        const lastPackedDate = new Date(device.last_packed);
        const dueDate = new Date(lastPackedDate);
        dueDate.setMonth(dueDate.getMonth() + device.reminder_interval);

        results.push({
          device: device.name,
          user: device.user_email,
          user_active: device.user_is_active,
          reminder_enabled: device.reminder_enabled,
          last_packed: device.last_packed,
          due_date: dueDate.toISOString(),
          is_due: now >= dueDate,
          will_send: now >= dueDate && device.user_is_active && device.reminder_enabled,
          last_reminder: device.last_reminder || 'noch nie'
        });
      }

      resolve(results);
    });
  });
}