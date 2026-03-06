const axios = require('axios');

// Test enrollment endpoint
async function testEnrollment() {
  const BASE_URL = 'http://localhost:5002';
  
  try {
    console.log('🔍 Testing enrollment endpoint...\n');
    
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('✅ Login successful');
    console.log(`User ID: ${userId}`);
    console.log(`Token: ${token.substring(0, 20)}...\n`);
    
    // Step 2: Get available courses
    console.log('Step 2: Fetching courses...');
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`);
    const courses = coursesResponse.data;
    console.log(`✅ Found ${courses.length} courses`);
    
    if (courses.length === 0) {
      console.log('⚠️ No courses available. Please create a course first.');
      return;
    }
    
    const testCourse = courses[0];
    console.log(`Test course: ${testCourse.title} (ID: ${testCourse.id || testCourse._id})\n`);
    
    // Step 3: Try to enroll
    console.log('Step 3: Attempting enrollment...');
    const courseId = testCourse.id || testCourse._id;
    
    const enrollResponse = await axios.post(
      `${BASE_URL}/api/learning/enroll`,
      { courseId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Enrollment successful!');
    console.log('Response:', enrollResponse.data);
    
  } catch (error) {
    console.error('❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testEnrollment();
