const mysql = require('mysql2');
require('dotenv').config();

// Create database if not exists (without selecting a specific database)
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    connection.connect((err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
      }
    });

    const dbName = process.env.DB_NAME || 'lms';
    connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
      if (err) {
        console.error('Error creating database:', err);
        reject(err);
      } else {
        console.log('Database ready');
        connection.end();
        resolve();
      }
    });
  });
};

// Initialize database first, then create pool
let promisePool;

const setupPool = async () => {
  try {
    await initDatabase();
    
    // Now create the pool with the database
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
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
};

module.exports = { setupPool, getPool: () => promisePool };
