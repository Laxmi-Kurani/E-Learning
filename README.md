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
- MySQL2 database integration
- RESTful API architecture

**Database**
- MySQL 8.0+
- Tables: users, courses, assessments, progress, discussions, feedback

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

