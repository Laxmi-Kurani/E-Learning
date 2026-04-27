const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
      db.close();
      process.exit(1);
    }

    if (!tables.length) {
      console.log('No tables found.');
      db.close();
      return;
    }

    console.log('Tables found:', tables.map(t => t.name));
    let remaining = tables.length;

    tables.forEach(t => {
      db.get(`SELECT COUNT(*) AS count FROM "${t.name}"`, (countErr, row) => {
        if (countErr) {
          console.error('Error counting rows for', t.name, countErr);
        } else {
          console.log(`${t.name}: ${row.count}`);
        }
        if (--remaining === 0) {
          db.close();
        }
      });
    });
  });
});
