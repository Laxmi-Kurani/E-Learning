const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database\n');

    // Delete existing admin
    await connection.query('DELETE FROM user WHERE email = ?', [process.env.ADMIN_EMAIL]);
    console.log('Cleared existing admin user');

    // Create fresh admin with correct password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await connection.query(
      'INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', process.env.ADMIN_EMAIL, hashedPassword, 'ADMIN']
    );

    console.log('\n✅ Admin user created successfully!\n');
    console.log('Login credentials:');
    console.log('📧 Email:', process.env.ADMIN_EMAIL);
    console.log('🔑 Password:', process.env.ADMIN_PASSWORD);
    
    // Verify by trying to compare password
    const [users] = await connection.query('SELECT * FROM user WHERE email = ?', [process.env.ADMIN_EMAIL]);
    const user = users[0];
    
    const isValid = await bcrypt.compare(process.env.ADMIN_PASSWORD, user.password);
    console.log('\n✅ Password verification:', isValid ? 'PASSED' : 'FAILED');
    
    if (isValid) {
      console.log('\n🎉 You can now login with the credentials above!');
    } else {
      console.log('\n❌ Something went wrong with password hashing');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdmin();
