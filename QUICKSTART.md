# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start Database

Make sure MySQL is running on localhost:3306 with root user and no password (or update backend/.env).

### Step 2: Start Backend
```bash
cd backend
npm install
npm start
```
Backend will run on http://localhost:8080

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm start
```
Frontend will open automatically at http://localhost:3000

## 🎯 Access Points

- **Application:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin
- **Backend API:** http://localhost:8080/api/health

## 🔐 Default Admin Login

- **Email:** admin@gmail.com
- **Password:** admin123

## 📊 Database Access

### Using MySQL CLI
```bash
mysql -u root -p
# Press Enter (no password)
USE lms;
SHOW TABLES;
```

## 🛠️ Troubleshooting

**Backend won't start:**
- Make sure MySQL is running
- Check backend/.env for correct database credentials

**Frontend shows network error:**
- Make sure backend is running on port 8080
- Check browser console for errors

**Database connection failed:**
- Verify MySQL is running: `mysql -u root -p`
- Check if port 3306 is available

## 📝 API Testing

Test the backend:
```bash
# Health check
curl http://localhost:8080/api/health

# Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

## 🎓 Next Steps

1. Login with admin credentials
2. Create some courses from the admin dashboard
3. Register as a regular user
4. Enroll in courses and explore features
