const bcrypt = require('bcryptjs');

async function testPassword() {
  const hash = '$2a$10$S81XpTpco0xCulnn5FuJKeEX/LAB/mfQHHbXUPVQAFbkGzMaJaXGe'; // admin@gmail.com
  const password = 'admin123';

  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password match:', isMatch);
}

testPassword();