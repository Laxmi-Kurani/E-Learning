const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';

console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  
  // Test creating a simple document
  const testSchema = new mongoose.Schema({
    name: String,
    created: { type: Date, default: Date.now }
  });
  
  const TestModel = mongoose.model('Test', testSchema);
  
  const testDoc = new TestModel({ name: 'Test Document' });
  
  return testDoc.save();
})
.then((doc) => {
  console.log('✅ Test document created:', doc);
  console.log('MongoDB is working correctly!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.error('Full error:', error);
  process.exit(1);
});
