const axios = require('axios');
(async () => {
  const login = await axios.post('http://localhost:8080/api/auth/login', { email: 'admin@gmail.com', password: 'admin123' });
  const token = login.data.token;
  try {
    const res = await axios.get('http://localhost:8080/api/users/17/profile-image', { headers: { Authorization: `Bearer ${token}` }, responseType: 'json' });
    console.log('profile-image response (json):', res.data);
  } catch (e) {
    if (e.response) {
      console.error('status', e.response.status, 'data', e.response.data);
    } else {
      console.error('error', e.message);
    }
  }
})();