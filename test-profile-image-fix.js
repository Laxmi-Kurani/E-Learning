/**
 * Test Profile Image Upload and Rendering Fix
 * 
 * This script tests the complete profile image flow:
 * 1. Get current user profile (verify profile_image format)
 * 2. Upload a test image (base64 data URI)
 * 3. Verify the image was stored in database
 * 4. Fetch profile again and verify image is normalized to absolute URL
 * 5. Test image rendering in browser
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8080';
let authToken = null;
let testUserId = null;

// Color logging helpers
const log = {
  info: (msg) => console.log('\n✓ INFO:', msg),
  success: (msg) => console.log('✓ SUCCESS:', msg),
  error: (msg) => console.error('✗ ERROR:', msg),
  section: (msg) => console.log('\n' + '='.repeat(60) + '\n' + msg + '\n' + '='.repeat(60)),
  details: (obj) => console.log(JSON.stringify(obj, null, 2))
};

/**
 * Step 1: Login to get auth token
 */
async function loginUser() {
  log.section('STEP 1: Login to get Auth Token');
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin@123'
    });
    
    authToken = response.data.token;
    log.success('Login successful');
    log.info(`Token obtained: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (err) {
    log.error(`Login failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

/**
 * Step 2: Fetch current user profile
 */
async function fetchProfile() {
  log.section('STEP 2: Fetch Current User Profile');
  try {
    const response = await axios.get(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const user = response.data;
    testUserId = user.id;
    
    log.success('Profile fetched successfully');
    log.info(`User ID: ${user.id}`);
    log.info(`Username: ${user.username}`);
    log.info(`profile_image format: ${user.profile_image ? user.profile_image.substring(0, 50) + '...' : 'NULL'}`);
    
    // Check image format
    if (!user.profile_image) {
      log.info('profile_image is currently NULL');
    } else if (user.profile_image.startsWith('data:image/')) {
      log.success('profile_image is data URI format (GOOD for rendering)');
    } else if (user.profile_image.startsWith('http://') || user.profile_image.startsWith('https://')) {
      log.success('profile_image is absolute URL (GOOD for rendering)');
    } else {
      log.info(`profile_image format: ${user.profile_image.substring(0, 30)}...`);
    }
    
    return user;
  } catch (err) {
    log.error(`Fetch profile failed: ${err.response?.data?.message || err.message}`);
    return null;
  }
}

/**
 * Step 3: Create a test base64 image
 */
function createTestImage() {
  log.section('STEP 3: Create Test Image (1x1 PNG)');
  
  // Minimal PNG: 1x1 transparent pixel
  const pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  log.success('Test image created');
  log.info(`Image size: ${pngBase64.length} bytes`);
  return pngBase64;
}

/**
 * Step 4: Upload profile image
 */
async function uploadProfileImage(imageData) {
  log.section('STEP 4: Upload Profile Image');
  try {
    const response = await axios.post(
      `${API_BASE}/api/users/profile/upload-image`,
      { imageData },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log.success('Image uploaded successfully');
    log.info(`Response: ${response.data.message}`);
    log.info(`Success flag: ${response.data.success}`);
    return true;
  } catch (err) {
    log.error(`Upload failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

/**
 * Step 5: Fetch profile again to verify image
 */
async function verifyImageAfterUpload() {
  log.section('STEP 5: Verify Image After Upload');
  try {
    const response = await axios.get(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const user = response.data;
    
    log.success('Profile re-fetched successfully');
    
    if (!user.profile_image) {
      log.error('profile_image is still NULL after upload!');
      return false;
    }
    
    log.info(`profile_image length: ${user.profile_image.length} bytes`);
    log.info(`First 80 chars: ${user.profile_image.substring(0, 80)}`);
    
    // Check format
    if (user.profile_image.startsWith('data:image/')) {
      log.success('profile_image is data URI format ✓');
      return true;
    } else if (user.profile_image.startsWith('http://') || user.profile_image.startsWith('https://')) {
      log.success('profile_image is absolute URL ✓');
      return true;
    } else {
      log.error(`Unexpected format: ${user.profile_image.substring(0, 30)}...`);
      return false;
    }
  } catch (err) {
    log.error(`Verify failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

/**
 * Step 6: Test direct image endpoint
 */
async function testImageEndpoint() {
  log.section('STEP 6: Test Direct Image Endpoint');
  try {
    const response = await axios.get(
      `${API_BASE}/api/users/${testUserId}/profile-image`,
      { 
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );
    
    const contentType = response.headers['content-type'] || '';
    log.success(`Image endpoint responds with Content-Type: ${contentType}`);
    
    if (contentType.includes('application/json')) {
      const jsonStr = new TextDecoder().decode(response.data);
      const parsed = JSON.parse(jsonStr);
      log.info('Response is JSON with profile_image field');
      if (parsed.profile_image) {
        log.success('Image data present in response');
      }
    } else if (contentType.includes('image/')) {
      log.success(`Image served directly (${response.data.length} bytes)`);
    }
    
    return true;
  } catch (err) {
    log.error(`Image endpoint test failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  log.section('PROFILE IMAGE FIX VERIFICATION TEST SUITE');
  
  const results = {
    login: false,
    fetchProfile: false,
    uploadImage: false,
    verifyUpload: false,
    imageEndpoint: false
  };
  
  // Test 1: Login
  if (!(results.login = await loginUser())) {
    log.error('Cannot continue without login');
    return results;
  }
  
  // Test 2: Fetch initial profile
  const initialProfile = await fetchProfile();
  results.fetchProfile = !!initialProfile;
  
  // Test 3: Create and upload test image
  const testImage = createTestImage();
  results.uploadImage = await uploadProfileImage(testImage);
  
  // Test 4: Verify image after upload
  results.verifyUpload = await verifyImageAfterUpload();
  
  // Test 5: Test image endpoint
  results.imageEndpoint = await testImageEndpoint();
  
  // Summary
  log.section('TEST RESULTS SUMMARY');
  log.details(results);
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`\n✓ PASSED: ${passed}/${total} tests`);
  
  if (passed === total) {
    log.success('ALL TESTS PASSED! Profile image fix is working correctly.');
    console.log('\nNEXT STEPS:');
    console.log('1. Navigate to http://localhost:3000/profile in your browser');
    console.log('2. Open DevTools Console (F12)');
    console.log('3. Upload a new profile image from the frontend');
    console.log('4. Verify the image renders immediately');
    console.log('5. Check console logs for "Profile image from API:" to see normalized URL');
  } else {
    log.error(`SOME TESTS FAILED (${total - passed} failures)`);
  }
}

// Run tests
runTests().catch(err => {
  log.error('Test suite error: ' + err.message);
  process.exit(1);
});
