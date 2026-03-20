/**
 * Debug script to check profile image in database
 */

const mysql = require('mysql2/promise');

async function checkProfileImage() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'lms_db'
    });

    // Get first user with profile image
    const [rows] = await connection.execute(
      'SELECT id, username, profile_image FROM user WHERE profile_image IS NOT NULL LIMIT 1'
    );

    if (rows.length === 0) {
      console.log('No user with profile image found');
      return;
    }

    const user = rows[0];
    console.log('\n=== Profile Image Debug ===');
    console.log('User ID:', user.id);
    console.log('Username:', user.username);
    console.log('Image Length:', user.profile_image ? user.profile_image.length : 0);
    console.log('Image Preview (first 100 chars):', user.profile_image ? user.profile_image.substring(0, 100) : 'NULL');
    console.log('Starts with data:image/:', user.profile_image ? user.profile_image.startsWith('data:image/') : false);
    console.log('\n=== Test API Call ===');
    
    // Test API call
    const response = await fetch('http://localhost:8080/api/users/profile', {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwMDAwMDAwMH0.dummy`
      }
    });

    console.log('API Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Has profile_image:', !!data.profile_image);
      if (data.profile_image) {
        console.log('Image Length from API:', data.profile_image.length);
        console.log('Image Preview from API:', data.profile_image.substring(0, 100));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkProfileImage();
