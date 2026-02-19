const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      mobileNumber, 
      dob, 
      gender, 
      location, 
      profession, 
      linkedin_url, 
      github_url 
    } = req.body;
    const db = getPool();
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      `INSERT INTO user (username, email, password, mobileNumber, dob, gender, location, profession, linkedin_url, github_url, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, mobileNumber || null, dob || null, gender || null, location || null, profession || null, linkedin_url || null, github_url || null, 'USER']
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getPool();

    const [users] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: parseInt(process.env.JWT_EXPIRATION) }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;

// Logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // For JWT-based auth stored in client localStorage, logout is handled client-side by clearing tokens.
    // This endpoint exists to give the client an authenticated route to call during logout
    // and to allow server-side token revocation in the future.
    return res.json({ message: 'Logout successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});
