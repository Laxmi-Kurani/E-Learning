const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'lms' });
    const [rows] = await conn.execute('SELECT id, username, email, profile_image FROM user WHERE email = ?', ['admin@gmail.com']);
    console.log(rows);
    await conn.end();
  } catch (e) {
    console.error(e);
  }
})();