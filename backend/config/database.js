const mysql = require('mysql2');
require('dotenv').config();

let promisePool;

const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      const dbName = process.env.DB_NAME || 'lms';
      connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        connection.end();
        if (err) {
          reject(err);
        } else {
          console.log('Database ready');
          resolve();
        }
      });
    });
  });
};

const setupPool = async () => {
  await initDatabase();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  promisePool = pool.promise();
  return promisePool;
};

const getPool = () => promisePool;

module.exports = { setupPool, getPool };
