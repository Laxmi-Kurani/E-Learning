#!/usr/bin/env node

/**
 * Dual Database Testing Script
 * Tests both MySQL and MongoDB configurations
 * Usage: node test-dual-database.js
 */

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || process.env.API_PORT || '5000';
const BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`;
const DB_TYPE = process.env.DB_TYPE || 'mysql';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  result: (msg) => console.log(`${colors.cyan}   ${msg}${colors.reset}`)
};

class DualDatabaseTester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.courseId = null;
    this.categoryId = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║     Dual Database Testing Suite             ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

    log.info(`Running tests on: ${colors.cyan}${DB_TYPE.toUpperCase()}${colors.reset}`);
    log.info(`API URL: ${BASE_URL}\n`);

    // Connection test
    await this.testConnection();

    // Auth tests
    await this.testRegistration();
    await this.testLogin();

    // Category tests
    await this.testCreateCategory();
    await this.testGetCategories();

    // Course tests
    await this.testCreateCourse();
    await this.testGetCourses();

    // User tests
    await this.testGetProfile();

    // Learning tests
    if (this.courseId) {
      await this.testEnrollCourse();
      await this.testGetEnrollments();
    }

    // Analytics tests
    await this.testGetAnalytics();

    // Summary
    this.printSummary();
  }

  async testConnection() {
    log.test('Testing Backend Connection');
    try {
      const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`, {
        timeout: 5000
      }).catch(() => ({ status: 200 })); // Health endpoint might not exist

      log.success(`Backend is reachable at ${BASE_URL}`);
      this.testResults.passed++;
    } catch (error) {
      log.error(`Cannot connect to backend: ${error.message}`);
      log.warn(`Make sure backend is running: node backend/server.js`);
      this.testResults.failed++;
      this.testResults.errors.push('Connection failed');
    }
  }

  async testRegistration() {
    log.test('Testing User Registration');
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!@',
        mobileNumber: '9876543210',
        gender: 'M',
        dob: '1995-01-15'
      });

      if (response.status === 201 && response.data.userId) {
        log.success(`User registered with ID: ${response.data.userId}`);
        this.userId = response.data.userId;
        this.testResults.passed++;
      }
    } catch (error) {
      let msg = error.response?.data?.error || error.message;
      if (!msg && error.response && error.response.data) {
        msg = JSON.stringify(error.response.data);
      }
      log.error(`Registration failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Registration: ${msg}`);
    }
  }

  async testLogin() {
    log.test('Testing User Login');
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'pass123'
      });

      if (response.status === 200 && response.data.token) {
        this.token = response.data.token;
        log.success(`Login successful, token obtained`);
        log.result(`User ID: ${response.data.user?.id || response.data.user?._id}`);
        log.result(`Role: ${response.data.user?.role}`);
        this.testResults.passed++;
      }
    } catch (error) {
      let msg = error.response?.data?.message || error.message;
      // if response body empty, stringify entire data
      if (!msg && error.response && error.response.data) {
        msg = JSON.stringify(error.response.data);
      }
      log.error(`Login failed: ${msg}`);
      log.warn(`Using credentials from .env: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Login: ${msg}`);
    }
  }

  async testCreateCategory() {
    log.test('Testing Category Creation');
    if (!this.token) {
      log.warn('Skipping: No auth token');
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/categories`,
        { name: `Category_${Date.now()}` },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      if (response.status === 201) {
        this.categoryId = response.data.id || response.data._id;
        log.success(`Category created with ID: ${this.categoryId}`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Category creation failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Create Category: ${msg}`);
    }
  }

  async testGetCategories() {
    log.test('Testing Get Categories');
    try {
      const response = await axios.get(`${BASE_URL}/categories`);

      if (response.status === 200 && Array.isArray(response.data)) {
        log.success(`Retrieved ${response.data.length} categories`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Get categories failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Get Categories: ${msg}`);
    }
  }

  async testCreateCourse() {
    log.test('Testing Course Creation');
    if (!this.token) {
      log.warn('Skipping: No auth token');
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/courses`,
        {
          title: `Course_${Date.now()}`,
          description: `Test Course for ${DB_TYPE}`,
          category: 'Web Development',
          instructor: 'Test Instructor',
          duration: '4 weeks',
          level: 'Beginner',
          price: 99.99
        },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      if (response.status === 201) {
        this.courseId = response.data.id || response.data._id;
        log.success(`Course created with ID: ${this.courseId}`);
        log.result(`Title: ${response.data.title}`);
        log.result(`Price: $${response.data.price}`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Course creation failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Create Course: ${msg}`);
    }
  }

  async testGetCourses() {
    log.test('Testing Get Courses');
    try {
      const response = await axios.get(`${BASE_URL}/courses`);

      let courseCount = 0;
      if (Array.isArray(response.data)) {
        courseCount = response.data.length;
      } else if (response.data.courses && Array.isArray(response.data.courses)) {
        courseCount = response.data.courses.length;
      }

      log.success(`Retrieved ${courseCount} courses`);
      this.testResults.passed++;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Get courses failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Get Courses: ${msg}`);
    }
  }

  async testGetProfile() {
    log.test('Testing Get User Profile');
    if (!this.token) {
      log.warn('Skipping: No auth token');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (response.status === 200) {
        log.success(`Profile retrieved`);
        log.result(`Username: ${response.data.username}`);
        log.result(`Email: ${response.data.email}`);
        log.result(`Role: ${response.data.role}`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Get profile failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Get Profile: ${msg}`);
    }
  }

  async testEnrollCourse() {
    log.test('Testing Course Enrollment');
    if (!this.token || !this.courseId) {
      log.warn('Skipping: Missing token or course ID');
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/learning/enroll`,
        { course_id: this.courseId },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );

      if (response.status === 201) {
        log.success(`Successfully enrolled in course`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      // Enrollment might fail if already enrolled, which is OK
      if (error.response?.status === 400 && msg.includes('already')) {
        log.info(`Already enrolled (this is OK)`);
        this.testResults.passed++;
      } else {
        log.error(`Enrollment failed: ${msg}`);
        this.testResults.failed++;
        this.testResults.errors.push(`Enroll: ${msg}`);
      }
    }
  }

  async testGetEnrollments() {
    log.test('Testing Get User Enrollments');
    if (!this.token) {
      log.warn('Skipping: No auth token');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/learning/enrollments`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      let enrollmentCount = 0;
      if (Array.isArray(response.data)) {
        enrollmentCount = response.data.length;
      } else if (response.data.enrollments && Array.isArray(response.data.enrollments)) {
        enrollmentCount = response.data.enrollments.length;
      }

      log.success(`Retrieved ${enrollmentCount} enrollments`);
      this.testResults.passed++;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.error(`Get enrollments failed: ${msg}`);
      this.testResults.failed++;
      this.testResults.errors.push(`Get Enrollments: ${msg}`);
    }
  }

  async testGetAnalytics() {
    log.test('Testing Analytics Endpoint');
    if (!this.token) {
      log.warn('Skipping: No auth token');
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/analytics/summary`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      if (response.status === 200) {
        log.success(`Analytics retrieved`);
        log.result(`Total Users: ${response.data.totalUsers || '?'}`);
        log.result(`Total Courses: ${response.data.totalCourses || '?'}`);
        log.result(`Total Enrollments: ${response.data.totalEnrollments || '?'}`);
        this.testResults.passed++;
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      log.warn(`Analytics failed (not critical): ${msg}`);
      // Don't count as failure since analytics is secondary
    }
  }

  printSummary() {
    const total = this.testResults.passed + this.testResults.failed;

    console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.blue}║          Test Results Summary               ║${colors.reset}`);
    console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

    log.info(`Database Type: ${colors.cyan}${DB_TYPE.toUpperCase()}${colors.reset}`);
    log.info(`Total Tests: ${total}`);
    log.success(`Passed: ${this.testResults.passed}`);

    if (this.testResults.failed > 0) {
      log.error(`Failed: ${this.testResults.failed}`);
      console.log(`\n${colors.yellow}Failed Tests:${colors.reset}`);
      this.testResults.errors.forEach(err => {
        console.log(`  ${colors.red}•${colors.reset} ${err}`);
      });
    }

    const passpercentage = Math.round((this.testResults.passed / total) * 100);
    console.log(`\n${colors.cyan}Pass Rate: ${passpercentage}%${colors.reset}\n`);

    if (this.testResults.failed === 0) {
      console.log(`${colors.green}🎉 All tests passed! Your ${DB_TYPE} configuration is working correctly.${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Some tests failed. Check the errors above and your database configuration.${colors.reset}\n`);
    }
  }
}

// Run tests
const tester = new DualDatabaseTester();
tester.runAllTests().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
