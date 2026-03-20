const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'lms' });
    await conn.execute('UPDATE user SET profile_image = ? WHERE email = ?', ['/images/example.png', 'admin@gmail.com']);
    const [rows] = await conn.execute('SELECT profile_image FROM user WHERE email = ?', ['admin@gmail.com']);
    console.log(rows);
    await conn.end();
  } catch (error) {
    console.error(error);
  }
})();