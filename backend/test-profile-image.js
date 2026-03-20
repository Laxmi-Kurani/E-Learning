const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('http://localhost:8080/api/auth/login', { email: 'admin@gmail.com', password: 'admin123' });
    console.log('token', login.data.token);
    const profile = await axios.get('http://localhost:8080/api/users/profile', {
      headers: { Authorization: `Bearer ${login.data.token}` }
    });
    console.log('profile', profile.data);
  } catch (error) {
    console.error('error', error.response?.status, error.response?.data || error.message);
  }
})();