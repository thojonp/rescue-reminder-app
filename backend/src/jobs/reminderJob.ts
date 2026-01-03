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
      SELECT d.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
      FROM devices d
      JOIN users u ON d.user_id = u.id
      WHERE u.is_active = 1 AND d.reminder_enabled = 1
    `;

    db.all(sql, [], async (err, rows: DeviceWithUser[]) => {
      if (err) {
        console.error('❌ Fehler beim Abrufen der Geräte:', err);
        return;
      }

      let firstRemindersSent = 0;
      let secondRemindersSent = 0;
      let skippedCount = 0;

      for (const device of rows) {
        const lastPackedDate = new Date(device.last_packed);
        const dueDate = new Date(lastPackedDate);
        dueDate.setMonth(dueDate.getMonth() + device.reminder_interval);
        
        // Datum für zweite Erinnerung (1 Monat nach Fälligkeit)
        const secondReminderDate = new Date(dueDate);
        secondReminderDate.setMonth(secondReminderDate.getMonth() + 1);

        // Erste Erinnerung: Fälligkeitsdatum erreicht und noch nicht gesendet
        if (now >= dueDate && !device.first_reminder_sent) {
          try {
            await sendReminderEmail(
              device.user_email!,
              device.user_first_name!,
              device.user_last_name!,
              device.device_name,
              device.last_packed,
              device.reminder_interval,
              1 // Erste Erinnerung
            );

            const updateSql = 'UPDATE devices SET first_reminder_sent = ? WHERE id = ?';
            db.run(updateSql, [now.toISOString(), device.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Fehler beim Aktualisieren von Gerät ${device.id}:`, updateErr);
              }
            });

            firstRemindersSent++;
            console.log(`✅ Erste Erinnerung gesendet für "${device.device_name}" an ${device.user_email}`);

          } catch (error) {
            console.error(`❌ Fehler beim Senden an ${device.user_email}:`, error);
          }
        }
        // Zweite Erinnerung: 1 Monat nach Fälligkeit und erste Erinnerung bereits gesendet
        else if (now >= secondReminderDate && device.first_reminder_sent && !device.second_reminder_sent) {
          try {
            await sendReminderEmail(
              device.user_email!,
              device.user_first_name!,
              device.user_last_name!,
              device.device_name,
              device.last_packed,
              device.reminder_interval,
              2 // Zweite Erinnerung
            );

            const updateSql = 'UPDATE devices SET second_reminder_sent = ? WHERE id = ?';
            db.run(updateSql, [now.toISOString(), device.id], (updateErr) => {
              if (updateErr) {
                console.error(`❌ Fehler beim Aktualisieren von Gerät ${device.id}:`, updateErr);
              }
            });

            secondRemindersSent++;
            console.log(`✅ Zweite Erinnerung gesendet für "${device.device_name}" an ${device.user_email}`);

          } catch (error) {
            console.error(`❌ Fehler beim Senden an ${device.user_email}:`, error);
          }
        } else {
          skippedCount++;
        }
      }

      if (firstRemindersSent > 0) {
        console.log(`✅ ${firstRemindersSent} erste Erinnerung(en) gesendet`);
      }
      
      if (secondRemindersSent > 0) {
        console.log(`✅ ${secondRemindersSent} zweite Erinnerung(en) gesendet`);
      }
      
      if (skippedCount > 0) {
        console.log(`ℹ️  ${skippedCount} Gerät(e) noch nicht fällig oder bereits erinnert`);
      }
      
      if (firstRemindersSent === 0 && secondRemindersSent === 0 && skippedCount === 0) {
        console.log('ℹ️  Keine Geräte mit aktivierten Erinnerungen registriert');
      }
    });
  });

  console.log('⏰ Erinnerungs-Job gestartet (täglich um 9:00 Uhr)');
  console.log('📧 Erste Erinnerung: Bei Fälligkeit');
  console.log('📧 Zweite Erinnerung: 1 Monat nach Fälligkeit');
  console.log('🔄 Reset: Bei Änderung des Packdatums');
}