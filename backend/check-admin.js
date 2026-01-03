// Speichere diese Datei als: backend/check-admin.js
// Ausführen mit: node check-admin.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./rescue-reminder.db');

console.log('🔍 Überprüfe Admin-Status...\n');

// Alle Benutzer anzeigen
db.all('SELECT id, email, vorname, name, is_admin, is_active FROM users', [], (err, rows) => {
  if (err) {
    console.error('Fehler:', err);
    return;
  }

  console.log('📋 Alle Benutzer:');
  console.table(rows.map(row => ({
    ID: row.id,
    Email: row.email,
    Name: `${row.vorname} ${row.name}`,
    'Is Admin': row.is_admin ? '✅ JA' : '❌ NEIN',
    'Is Active': row.is_active ? '✅ Aktiv' : '❌ Inaktiv'
  })));

  // Prüfe ob Admin existiert
  const adminUser = rows.find(r => r.is_admin === 1);
  
  if (!adminUser) {
    console.log('\n⚠️  WARNUNG: Kein Admin-Benutzer gefunden!');
    console.log('\n📝 Um einen Benutzer zum Admin zu machen, führe aus:');
    console.log('   node check-admin.js set <email>');
    console.log('\nBeispiel:');
    console.log('   node check-admin.js set admin@rescue.com');
  } else {
    console.log(`\n✅ Admin-Benutzer gefunden: ${adminUser.email}`);
  }

  // Wenn "set" Parameter übergeben wurde
  const args = process.argv.slice(2);
  if (args[0] === 'set' && args[1]) {
    const email = args[1];
    console.log(`\n🔧 Setze ${email} als Admin...`);
    
    db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [email], function(err) {
      if (err) {
        console.error('❌ Fehler:', err);
        db.close();
        return;
      }

      if (this.changes === 0) {
        console.log('❌ Benutzer nicht gefunden!');
      } else {
        console.log('✅ Admin-Status erfolgreich gesetzt!');
        console.log('\n📌 Bitte melde dich neu an, damit die Änderungen wirksam werden.');
      }
      
      db.close();
    });
  } else {
    db.close();
  }
});
