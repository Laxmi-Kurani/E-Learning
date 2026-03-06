# MySQL Setup Guide for E-Learning System

## Option 1: Install MySQL with XAMPP (Easiest for Windows)

### Step 1: Download and Install XAMPP
1. Go to: https://www.apachefriends.org/download.html
2. Download XAMPP for Windows
3. Install XAMPP (default location: C:\xampp)

### Step 2: Start MySQL
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. MySQL should show "Running" in green

### Step 3: Verify MySQL is Running
Open Command Prompt and run:
```cmd
netstat -ano | findstr :3306
```
You should see a line with `:3306` - this means MySQL is running.

### Step 4: Test Connection
```cmd
cd backend
node test-mysql.js
```

You should see:
```
✅ MySQL Connection Successful!
✅ Database 'lms' is ready
✅ MySQL is working! You can now run: npm start
```

### Step 5: Start Backend
```cmd
npm start
```

---

## Option 2: Install MySQL Standalone

### Step 1: Download MySQL
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download "MySQL Installer for Windows"
3. Choose "mysql-installer-community"

### Step 2: Install MySQL
1. Run the installer
2. Choose "Developer Default" or "Server only"
3. Set root password to empty (or update your .env file)
4. Complete installation

### Step 3: Start MySQL Service
Open Command Prompt as Administrator:
```cmd
net start MySQL80
```

### Step 4: Test Connection
```cmd
cd backend
node test-mysql.js
```

---

## Option 3: Install Docker Desktop (For docker-compose)

### Step 1: Install Docker Desktop
1. Go to: https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Windows
3. Install and restart your computer

### Step 2: Start Docker Desktop
1. Open Docker Desktop application
2. Wait for it to start (whale icon in system tray)

### Step 3: Start MySQL Container
```cmd
cd D:\E-Learning
docker-compose up -d
```

### Step 4: Verify Container is Running
```cmd
docker ps
```

You should see `lms_mysql` container running.

### Step 5: Test Connection
```cmd
cd backend
node test-mysql.js
```

---

## Troubleshooting

### Error: "ECONNREFUSED"
- MySQL is not running
- Start MySQL using one of the methods above

### Error: "Access denied"
- Check your .env file
- Make sure DB_USER and DB_PASSWORD match your MySQL credentials

### Error: "Port 3306 already in use"
- Another MySQL instance is running
- Stop other MySQL services or change the port

---

## Current Configuration (.env)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lms
```

This configuration expects:
- MySQL running on localhost
- Username: root
- Password: empty (no password)
- Database: lms (will be created automatically)

---

## Quick Test Commands

### Test MySQL Connection:
```cmd
cd backend
node test-mysql.js
```

### Create Admin User:
```cmd
cd backend
node create-admin.js
```

### Start Backend:
```cmd
cd backend
npm start
```

### Start Frontend:
```cmd
cd frontend
npm start
```

---

## After MySQL is Running

1. Test connection: `node test-mysql.js`
2. Create admin: `node create-admin.js`
3. Start backend: `npm start`
4. Start frontend: `npm start` (in frontend folder)
5. Login at: http://localhost:3000
   - Email: admin@gmail.com
   - Password: admin123
