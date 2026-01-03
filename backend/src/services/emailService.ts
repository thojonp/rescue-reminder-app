import nodemailer from 'nodemailer';

// ⚠️ WICHTIG: Diese Konfiguration muss angepasst werden!
// Für Gmail:
// 1. Google-Konto → Sicherheit → 2-Faktor-Authentifizierung aktivieren
// 2. App-Passwort erstellen für "Mail"
// 3. Email und App-Passwort hier eintragen

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'deine-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'dein-app-passwort'
  }
});

export async function sendReminderEmail(
  email: string,
  vorname: string,
  name: string,
  deviceName: string,
  lastPacked: string,
  reminderInterval: number
) {
  const lastPackedDate = new Date(lastPacked);
  const nextDueDate = new Date(lastPackedDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + reminderInterval);

  const mailOptions = {
    from: '"Rettungsgerät Erinnerung" <deine-email@gmail.com>',
    to: email,
    subject: `Erinnerung: ${deviceName} überprüfen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Rettungsgerät Erinnerung</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #374151; margin-top: 0;">Hallo ${vorname} ${name},</h2>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Es ist Zeit, Ihr Rettungsgerät zu überprüfen und neu zu packen!
          </p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">📦 Gerät:</p>
            <p style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px; font-weight: 600;">${deviceName}</p>
            
            <p style="margin: 0 0 5px 0; color: #1e40af; font-weight: bold;">📅 Zuletzt gepackt:</p>
            <p style="margin: 0 0 15px 0; color: #1e3a8a;">${lastPackedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            
            <p style="margin: 0 0 5px 0; color: #1e40af; font-weight: bold;">🔔 Nächste Überprüfung:</p>
            <p style="margin: 0; color: #1e3a8a;">${nextDueDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">📋 Checkliste:</p>
            <ul style="color: #92400e; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li>Alle Gegenstände vollständig und funktionstüchtig?</li>
              <li>Verfallsdaten überprüft?</li>
              <li>Gerät ordnungsgemäß gepackt und zugänglich?</li>
              <li>Batterien falls vorhanden erneuern?</li>
            </ul>
          </div>
          
          <p style="color: #374151; margin-top: 25px;">
            Vielen Dank für Ihre Aufmerksamkeit und Sorgfalt! 🙏
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
            Diese automatische Erinnerung wird alle <strong>${reminderInterval} Monate</strong> versandt.<br>
            Sie erhalten diese Email, weil Sie Ihr Rettungsgerät in unserem System registriert haben.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email gesendet an ${email} für Gerät "${deviceName}"`);
  } catch (error) {
    console.error(`❌ Email-Fehler für ${email}:`, error);
    throw error;
  }
}

// Test-Funktion (optional)
export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email-Server verbunden');
    return true;
  } catch (error) {
    console.error('❌ Email-Server Verbindungsfehler:', error);
    return false;
  }
}
