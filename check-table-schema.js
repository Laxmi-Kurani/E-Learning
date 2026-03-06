const mysql = require('mysql2');
require('dotenv').config({ path: './backend/.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms'
});

connection.query('DESCRIBE user', (error, results) => {
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('User table columns:');
    results.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
  }
  connection.end();
});
