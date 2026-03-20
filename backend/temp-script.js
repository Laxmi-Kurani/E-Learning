const axios = require('axios');
(async () => {
  try {
    const login = await axios.post('http://localhost:8080/api/auth/login', {email:'admin@gmail.com', password:'admin123'});
    const token = login.data.token;
    console.log('token', token);
    const profile = await axios.get('http://localhost:8080/api/users/profile', { headers: { Authorization: 'Bearer ' + token } });
    console.log('profile status', profile.status, 'data', profile.data);
  } catch (e) {
    console.error('err', e.response?.status, e.response?.data ? JSON.stringify(e.response.data) : e.message);
  }
})();