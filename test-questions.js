#!/usr/bin/env node

/**
 * Question Management Module - Quick Verification Script
 * Run this script to verify all Question Management endpoints are working
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let adminToken = '';
let courseId = 1;

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to make HTTP requests
function makeRequest(method, endpoint, body = null, isAdmin = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test functions
async function testLogin() {
  console.log(`\n${colors.blue}=== LOGIN TEST ===${colors.reset}`);
  
  try {
    const response = await makeRequest('POST', `${BASE_URL}/auth/login`, {
      email: 'admin@elearning.com',
      password: 'Admin@123456'
    });

    if (response.status === 200 && response.body.token) {
      adminToken = response.body.token;
      console.log(`${colors.green}✓ Login successful${colors.reset}`);
      console.log(`  Token: ${adminToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`${colors.red}✗ Login failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Login error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testCreateQuestion() {
  console.log(`\n${colors.blue}=== CREATE QUESTION TEST ===${colors.reset}`);
  
  const question = {
    courseId: courseId,
    questionText: "What is the capital of France?",
    optionA: "London",
    optionB: "Paris",
    optionC: "Berlin",
    optionD: "Madrid",
    correctAnswer: "B"
  };

  try {
    const response = await makeRequest('POST', `${BASE_URL}/questions`, question);

    if (response.status === 201) {
      console.log(`${colors.green}✓ Question created successfully${colors.reset}`);
      console.log(`  Question ID: ${response.body.data.id}`);
      return response.body.data.id;
    } else {
      console.log(`${colors.red}✗ Create question failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.body)}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Create question error: ${error.message}${colors.reset}`);
    return null;
  }
}

async function testGetAllQuestions() {
  console.log(`\n${colors.blue}=== GET ALL QUESTIONS TEST ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/questions?page=1&limit=10`);

    if (response.status === 200 && response.body.data) {
      console.log(`${colors.green}✓ Get all questions successful${colors.reset}`);
      console.log(`  Total records: ${response.body.pagination.totalRecords}`);
      console.log(`  Current page: ${response.body.pagination.currentPage}`);
      console.log(`  Has next page: ${response.body.pagination.hasNextPage}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Get all questions failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Get all questions error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testGetCourseQuestions() {
  console.log(`\n${colors.blue}=== GET COURSE QUESTIONS TEST ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/questions/course/${courseId}?page=1&limit=5`);

    if (response.status === 200 && response.body.data) {
      console.log(`${colors.green}✓ Get course questions successful${colors.reset}`);
      console.log(`  Questions count: ${response.body.data.length}`);
      console.log(`  Total in course: ${response.body.pagination.totalRecords}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Get course questions failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Get course questions error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testSearchQuestions() {
  console.log(`\n${colors.blue}=== SEARCH QUESTIONS TEST ===${colors.reset}`);
  
  try {
    const response = await makeRequest('GET', `${BASE_URL}/questions/course/${courseId}?search=capital&limit=10`);

    if (response.status === 200 && response.body.data) {
      console.log(`${colors.green}✓ Search questions successful${colors.reset}`);
      console.log(`  Results found: ${response.body.data.length}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Search questions failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Search questions error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testUpdateQuestion(questionId) {
  console.log(`\n${colors.blue}=== UPDATE QUESTION TEST ===${colors.reset}`);
  
  if (!questionId) {
    console.log(`${colors.yellow}⊘ Skipping - no question ID${colors.reset}`);
    return false;
  }

  const updatedQuestion = {
    questionText: "What is the capital of Italy?",
    optionA: "Milan",
    optionB: "Rome",
    optionC: "Venice",
    optionD: "Florence",
    correctAnswer: "B"
  };

  try {
    const response = await makeRequest('PUT', `${BASE_URL}/questions/${questionId}`, updatedQuestion);

    if (response.status === 200) {
      console.log(`${colors.green}✓ Update question successful${colors.reset}`);
      console.log(`  Question ID: ${questionId}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Update question failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Update question error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testDeleteQuestion(questionId) {
  console.log(`\n${colors.blue}=== DELETE QUESTION TEST ===${colors.reset}`);
  
  if (!questionId) {
    console.log(`${colors.yellow}⊘ Skipping - no question ID${colors.reset}`);
    return false;
  }

  try {
    const response = await makeRequest('DELETE', `${BASE_URL}/questions/${questionId}`);

    if (response.status === 200) {
      console.log(`${colors.green}✓ Delete question successful${colors.reset}`);
      console.log(`  Question ID: ${questionId}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Delete question failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Delete question error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testBulkImport() {
  console.log(`\n${colors.blue}=== BULK IMPORT TEST ===${colors.reset}`);
  
  const bulkData = {
    courseId: courseId,
    questions: [
      {
        questionText: "What is 2+2?",
        optionA: "3",
        optionB: "4",
        optionC: "5",
        optionD: "6",
        correctAnswer: "B"
      },
      {
        questionText: "What is 3+3?",
        optionA: "5",
        optionB: "6",
        optionC: "7",
        optionD: "8",
        correctAnswer: "B"
      }
    ]
  };

  try {
    const response = await makeRequest('POST', `${BASE_URL}/questions/bulk/import`, bulkData);

    if (response.status === 201) {
      console.log(`${colors.green}✓ Bulk import successful${colors.reset}`);
      console.log(`  Questions imported: ${response.body.insertedCount}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Bulk import failed${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Bulk import error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Question Management Module - Test Suite      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════╝${colors.reset}`);
  
  const results = [];

  // Test 1: Login
  const loginSuccess = await testLogin();
  results.push({ name: 'Login', result: loginSuccess });

  if (!loginSuccess) {
    console.log(`\n${colors.red}Cannot proceed without login. Exiting.${colors.reset}`);
    return;
  }

  // Test 2: Create question
  const questionId = await testCreateQuestion();
  results.push({ name: 'Create Question', result: questionId !== null });

  // Test 3: Get all questions
  const getAllSuccess = await testGetAllQuestions();
  results.push({ name: 'Get All Questions', result: getAllSuccess });

  // Test 4: Get course questions
  const getCourseSuccess = await testGetCourseQuestions();
  results.push({ name: 'Get Course Questions', result: getCourseSuccess });

  // Test 5: Search questions
  const searchSuccess = await testSearchQuestions();
  results.push({ name: 'Search Questions', result: searchSuccess });

  // Test 6: Update question
  const updateSuccess = await testUpdateQuestion(questionId);
  results.push({ name: 'Update Question', result: updateSuccess });

  // Test 7: Bulk import
  const bulkSuccess = await testBulkImport();
  results.push({ name: 'Bulk Import', result: bulkSuccess });

  // Test 8: Delete question (do this last)
  const deleteSuccess = await testDeleteQuestion(questionId);
  results.push({ name: 'Delete Question', result: deleteSuccess });

  // Summary
  console.log(`\n${colors.blue}=== TEST SUMMARY ===${colors.reset}`);
  console.log(`${colors.blue}${'─'.repeat(50)}${colors.reset}`);
  
  let passCount = 0;
  for (const test of results) {
    const icon = test.result ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${test.name}`);
    if (test.result) passCount++;
  }

  console.log(`${colors.blue}${'─'.repeat(50)}${colors.reset}`);
  console.log(`\n${colors.green}Passed: ${passCount}/${results.length}${colors.reset}`);
  
  if (passCount === results.length) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Check the output above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
