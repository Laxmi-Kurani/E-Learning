const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    // Login first
    console.log('1. Testing login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'adminpassword'
    });
    
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status !== 200) {
      console.error('   Error:', loginRes.body);
      process.exit(1);
    }
    
    const token = loginRes.body.token;
    console.log('   ✓ Login successful\n');
    
    // Test the users endpoint
    console.log('2. Testing GET /api/users?role=INSTRUCTOR...');
    const usersRes = await makeRequest('GET', '/api/users?role=INSTRUCTOR', null, token);
    
    console.log(`   Status: ${usersRes.status}`);
    if (usersRes.status === 200) {
      console.log(`   ✓ Success! Found ${usersRes.body.length} instructors`);
      console.log('\n✓ API is now working correctly!');
    } else {
      console.log(`   Error: ${usersRes.body.message || usersRes.body}`);
      console.log('\n✗ API still has issues');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
