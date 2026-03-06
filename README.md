# Learning Management System

A comprehensive Learning Management System (LMS) built with React.js, Node.js/Express, and MySQL. This platform enables online course management, assessments, progress tracking, and certificate generation.

## Features

- **User Management** - Registration, authentication, and profile management
- **Course Management** - Create, edit, and organize courses with detailed content
- **Assessments** - Create and take course assessments with automatic grading
- **Progress Tracking** - Monitor user progress and completion status
- **Certificate Generation** - Automatic personalized certificates upon course completion
- **Discussion Forums** - Course-specific forums for user interaction
- **Admin Dashboard** - Comprehensive management of courses, users, and enrollments
- **Security** - JWT authentication with role-based access control (Admin/User)

## Tech Stack

**Frontend**
- React.js with React Router
- Tailwind CSS & Ant Design
- Axios for API communication
- jsPDF & html2canvas for certificates

**Backend**
- Node.js & Express.js
- JWT authentication
- MySQL2 database integration (legacy) – migrating toward an ORM layer
- RESTful API architecture

### Database & ORM support

The backend now includes an ORM layer and is capable of targeting **multiple database engines**.

* Set `DB_TYPE` in `.env` to choose the store. Supported values:
  * `mysql` (default – legacy SQL pool & Sequelize)
  * `postgres` or `sqlite` (Sequelize dialects)
  * `mongodb` (uses Mongoose instead of Sequelize)

* When using a SQL dialect, install the corresponding driver (`mysql2`, `pg`/`pg-hstore`, `sqlite3`) and the system uses Sequelize models located in `backend/models`.
* When `DB_TYPE=mongodb` you must provide a `MONGO_URI` connection string; Mongoose schemas defined in `models/index.js` mirror the SQL models. Example usage is shown in `services/userService.js` and `routes/category.routes.js`.
* Existing SQL-specific code remains functional via the legacy pool (`config/database.js`) for backward compatibility. You can migrate features gradually by branching on `DB_TYPE` in your services or by writing an abstraction layer.
* With this setup switching from MySQL to PostgreSQL, SQLite or even MongoDB is as simple as editing `.env` and installing the appropriate package. No code changes are required when the application only uses the exported models.

To fully convert to MongoDB you’ll eventually update all services and routes to use Mongoose queries; examples provided should serve as a guide.

**Database**
- MySQL 8.0+ (default, but not required)
- Tables / collections: users, courses, assessments, progress, discussions, feedback

## Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+

### Installation

1. Clone the repository
```bash
git clone https://github.com/PATMESH/Learning-Management-System.git
cd Learning-Management-System
```

2. Install backend dependencies
```bash
cd backend
npm install
npm start
```
Backend runs on http://localhost:8080

3. Install frontend dependencies (in a new terminal)
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

The backend automatically creates the database, tables, and default admin user on first run.

## 🧪 Testing Both Databases

This project supports **MySQL**, **PostgreSQL**, **SQLite**, and **MongoDB**. You can easily test with different databases by switching the `DB_TYPE` environment variable.

### Quick Database Switching

**Switch to MySQL:**
```bash
cd backend
npm run switch:mysql
npm start
```

**Switch to MongoDB:**
```bash
cd backend
npm run switch:mongodb
npm start
```

**Switch to PostgreSQL:**
```bash
cd backend
npm run switch:postgres
npm start
```

**Switch to SQLite:**
```bash
cd backend
npm run switch:sqlite
npm start
```

### Run Tests on Current Database

```bash
cd backend
npm run test:db
```

### Run Tests on Specific Database

```bash
# Test MySQL configuration
npm run test:mysql

# Test MongoDB configuration
npm run test:mongodb
```

### Comprehensive Testing Guide

For detailed step-by-step instructions on setting up and testing both databases, see: **[DUAL_DATABASE_TESTING_GUIDE.md](./DUAL_DATABASE_TESTING_GUIDE.md)**

**Quick Summary:** **[DUAL_DATABASE_SETUP_SUMMARY.md](./DUAL_DATABASE_SETUP_SUMMARY.md)** - includes quick commands, troubleshooting, and verification steps.

This guide includes:
- Database-specific setup instructions
- Connection verification steps
- API endpoint testing with curl
- Data validation queries
- Troubleshooting tips
- Performance comparison

### Database Configuration

Each database is configured via environment variables in `backend/.env`:

**For MySQL:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
```

**For MongoDB:**
```env
DB_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017/lms
```

**For PostgreSQL:**
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=lms_db
```

**For SQLite:**
```env
DB_TYPE=sqlite
DB_STORAGE=database.sqlite
```

## Default Credentials

**Admin Account**
- Email: admin@gmail.com
- Password: admin123

## Access Points

- Application: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- API Health Check: http://localhost:8080/api/health
- API Documentation: See backend/API_ENDPOINTS.md

## Usage

**As Admin:**
- Access admin dashboard at /admin
- Create and manage courses
- Add assessment questions
- Monitor user enrollments and progress

**As User:**
- Register and create an account
- Browse and enroll in courses
- Complete course content and assessments
- Receive certificates upon completion
- Participate in course discussions

## Contributing

Contributions are welcome! Feel free to open issues for bugs or feature requests, and submit pull requests to improve the project.

