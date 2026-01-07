import nodemailer from 'nodemailer';

// WICHTIG: Diese Konfiguration muss angepasst werden!
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.infomaniak.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: 'info@swissgliders.ch',
    pass: process.env.EMAIL_PASS || 'my3V%&fE5O70q*fN'
  }
});

export async function sendReminderEmail(
  email: string,
  firstName: string,
  lastName: string,
  deviceName: string,
  lastPacked: string,
  reminderInterval: number,
  reminderNumber: number = 1 // 1 = erste Erinnerung, 2 = zweite Erinnerung
) {
  const lastPackedDate = new Date(lastPacked);
  const nextDueDate = new Date(lastPackedDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + reminderInterval);

  const isSecondReminder = reminderNumber === 2;
  const subject = isSecondReminder 
    ? `ZWEITE Erinnerung: ${deviceName} überfällig!`
    : `Erinnerung: ${deviceName} überprüfen`;

  const mailOptions = {
    from: `"Rettungsgerät Erinnerung" <${'info@swissgliders.ch'}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isSecondReminder ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isSecondReminder ? '🚨 ZWEITE ERINNERUNG' : '🚨 Rettungsgerät Erinnerung'}
          </h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #374151; margin-top: 0;">Hallo ${firstName} ${lastName},</h2>
          
          ${isSecondReminder ? `
            <p style="color: #dc2626; font-size: 16px; line-height: 1.6; font-weight: bold;">
              Dies ist die zweite Erinnerung! Ihr Rettungsgerät ist bereits seit einem Monat überfällig.
            </p>
          ` : `
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              Es ist Zeit, Ihr Rettungsgerät zu überprüfen und neu zu packen!
            </p>
          `}
          
          <div style="background: ${isSecondReminder ? '#fef2f2' : '#f0f9ff'}; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${isSecondReminder ? '#dc2626' : '#3b82f6'};">
            <p style="margin: 0 0 10px 0; color: ${isSecondReminder ? '#991b1b' : '#1e40af'}; font-weight: bold;">📦 Gerät:</p>
            <p style="margin: 0 0 15px 0; color: ${isSecondReminder ? '#991b1b' : '#1e3a8a'}; font-size: 18px; font-weight: 600;">${deviceName}</p>
            
            <p style="margin: 0 0 5px 0; color: ${isSecondReminder ? '#991b1b' : '#1e40af'}; font-weight: bold;">📅 Zuletzt gepackt:</p>
            <p style="margin: 0 0 15px 0; color: ${isSecondReminder ? '#991b1b' : '#1e3a8a'};">${lastPackedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            
            <p style="margin: 0 0 5px 0; color: ${isSecondReminder ? '#991b1b' : '#1e40af'}; font-weight: bold;">🔔 Sollte gepackt werden bis:</p>
            <p style="margin: 0; color: ${isSecondReminder ? '#991b1b' : '#1e3a8a'};">${nextDueDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>
          
          <div style="background: ${isSecondReminder ? '#fee2e2' : '#fef3c7'}; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${isSecondReminder ? '#ef4444' : '#f59e0b'};">
            <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">📋 Checkliste:</p>
            <ul style="color: #92400e; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
              <li>Alle Gegenstände vollständig und funktionstüchtig?</li>
              <li>Verfallsdaten überprüft?</li>
              <li>Gerät ordnungsgemäß gepackt und zugänglich?</li>
              <li>Batterien falls vorhanden erneuern?</li>
            </ul>
          </div>
          
          ${isSecondReminder ? `
            <p style="color: #dc2626; margin-top: 25px; font-weight: bold;">
              ⚠️ Bitte packen Sie Ihr Rettungsgerät umgehend! Dies ist wichtig für Ihre Sicherheit.
            </p>
          ` : `
            <p style="color: #374151; margin-top: 25px;">
              Vielen Dank für Ihre Aufmerksamkeit und Sorgfalt! 🙏
            </p>
          `}
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
            ${isSecondReminder ? 'Dies ist die zweite und letzte automatische Erinnerung.' : `Diese automatische Erinnerung wird alle <strong>${reminderInterval} Monate</strong> versandt.`}<br>
            ${!isSecondReminder ? 'Falls Sie das Gerät nicht innerhalb eines Monats packen, erhalten Sie eine weitere Erinnerung.<br>' : ''}
            Sie erhalten diese Email, weil Sie Ihr Rettungsgerät in unserem System registriert haben.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ ${isSecondReminder ? 'Zweite' : 'Erste'} Erinnerung gesendet an ${email} für Gerät "${deviceName}"`);
  } catch (error) {
    console.error(`❌ Email-Fehler für ${email}:`, error);
    throw error;
  }
}

// Test-Email senden
export async function sendTestEmail(toEmail: string, fromName: string): Promise<void> {
  const mailOptions = {
    from: `"${fromName}" <${'info@swissgliders.ch'}>`,
    to: toEmail,
    subject: 'Test-Email - SMTP Konfiguration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ SMTP Test erfolgreich!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #374151;">Email-Konfiguration funktioniert</h2>
          
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Wenn Sie diese Email erhalten haben, ist Ihre SMTP-Konfiguration korrekt eingerichtet.
          </p>
          
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Konfiguration:</strong></p>
            <ul style="color: #065f46; margin: 10px 0;">
              <li>Host: ${'mail.infomaniak.com'}</li>
              <li>Port: ${'587'}</li>
              <li>Absender: ${'info@swissgliders.ch'}</li>
            </ul>
          </div>
          
          <p style="color: #374151;">
            Sie können nun Erinnerungs-Emails versenden! 🎉
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
          
          <p style="color: #9ca3af; font-size: 12px;">
            Dies ist eine automatisch generierte Test-Email vom Rettungsgerät Management System.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Verbindung testen (ohne Email zu senden)
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email-Server verbunden');
    return true;
  } catch (error) {
    console.error('❌ Email-Server Verbindungsfehler:', error);
    return false;
  }
}

// Fügen Sie diese Funktion zu Ihrer bestehenden emailService.ts hinzu:

export async function sendPasswordResetEmail(
  to: string, 
  resetLink: string, 
  userName: string
): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@swissgliders.ch',
    to,
    subject: '🔐 Passwort zurücksetzen - Rettungsgerät Management',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Encode Sans', Arial, sans-serif; line-height: 1.6; color: #1A1A1A; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #003B73 0%, #0099CC 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: linear-gradient(135deg, #003B73 0%, #0099CC 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .warning { background: #fff4ed; border-left: 4px solid #FF6B35; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Passwort zurücksetzen</h1>
          </div>
          <div class="content">
            <p>Hallo ${userName},</p>
            
            <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
            
            <p>Klicken Sie auf den folgenden Button, um ein neues Passwort zu setzen:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Passwort zurücksetzen</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Wichtig:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig.
            </div>
            
            <p>Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; color: #003B73;"><a href="${resetLink}">${resetLink}</a></p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Sie haben diese Anfrage nicht gestellt?</strong><br>
              Dann können Sie diese Email ignorieren. Ihr Passwort bleibt unverändert.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Swissgliders - Rettungsgerät Management</p>
            <p>Diese Email wurde automatisch generiert. Bitte antworten Sie nicht darauf.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password-Reset Email gesendet an: ${to}`);
  } catch (error) {
    console.error('Fehler beim Senden der Password-Reset Email:', error);
    throw error;
  }
}