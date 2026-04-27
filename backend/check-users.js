const { Sequelize, User } = require('./models');

async function checkUsers() {
  try {
    const users = await User.findAll();
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Username: ${user.username}, Role: ${user.role}, Password: ${user.password}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();