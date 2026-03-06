const { Sequelize } = require('sequelize');
require('dotenv').config();

// determine which database type to use; defaults to mysql
const DB_TYPE = process.env.DB_TYPE || 'mongodb';

let sequelize = null;
let mongoose = null;
let User = null;
let Category = null;
let Course = null;
let Learning = null;
let Progress = null;
let Assessment = null;
let Question = null;
let Discussion = null;
let Feedback = null;
let Certificate = null;
let Notification = null;

if (DB_TYPE === 'mongodb') {
  // initialize mongoose
  mongoose = require('mongoose');
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const { Schema } = mongoose;

  const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'USER' },
    isActive: { type: Boolean, default: true },
    mobileNumber: String,
    gender: String,
    dob: Date,
    profession: String,
    location: String,
    linkedin_url: String,
    github_url: String,
    profile_image: String,
    reset_token: String,
    reset_token_expiry: Date,
  }, {
    collection: 'user',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  });

  const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
  }, { collection: 'category' });

  const courseSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    instructor: String,
    duration: String,
    level: String,
    category: String,
    image_url: String,
    video_url: String,
    price: { type: Number, default: 0 },
  }, { collection: 'course', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

  const learningSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING' },
    enrolled_at: { type: Date, default: Date.now },
    approved_at: Date,
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
  }, { collection: 'learning' });

  const progressSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    completion_percentage: { type: Number, default: 0 },
    last_accessed: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
  }, { collection: 'progress' });

  const assessmentSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    score: { type: Number, default: 0 },
    total_questions: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    completed_at: { type: Date, default: Date.now },
  }, { collection: 'assessment' });

  const questionSchema = new Schema({
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    question_text: { type: String, required: true },
    option_a: String,
    option_b: String,
    option_c: String,
    option_d: String,
    correct_answer: String,
    created_at: { type: Date, default: Date.now },
  }, { collection: 'question' });

  const discussionSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  }, { collection: 'discussion' });

  const feedbackSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    created_at: { type: Date, default: Date.now },
  }, { collection: 'feedback' });

  const certificateSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    certificate_url: String,
    issued_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['NOT_ISSUED','ISSUED','REVOKED'], default: 'NOT_ISSUED' },
  }, { collection: 'certificate' });

  const notificationSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: String,
    type: String,
    is_read: { type: Boolean, default: false },
    related_entity_type: String,
    related_entity_id: Schema.Types.ObjectId,
    created_at: { type: Date, default: Date.now },
  }, { collection: 'notification' });

  User = mongoose.model('User', userSchema);
  Category = mongoose.model('Category', categorySchema);
  Course = mongoose.model('Course', courseSchema);
  Learning = mongoose.model('Learning', learningSchema);
  Progress = mongoose.model('Progress', progressSchema);
  Assessment = mongoose.model('Assessment', assessmentSchema);
  Question = mongoose.model('Question', questionSchema);
  Discussion = mongoose.model('Discussion', discussionSchema);
  Feedback = mongoose.model('Feedback', feedbackSchema);
  Certificate = mongoose.model('Certificate', certificateSchema);
  Notification = mongoose.model('Notification', notificationSchema);
  module.exports = { DB_TYPE, mongoose, User, Category, Course, Learning, Progress, Assessment, Question, Discussion, Feedback, Certificate, Notification };
} else {  // SQL dialect via Sequelize
  const { Sequelize } = require('sequelize');

  if (DB_TYPE === 'mysql') {
    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      port: process.env.DB_PORT || 3306,
      logging: false,
    });
  } else if (DB_TYPE === 'postgres') {
    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: false,
    });
  } else if (DB_TYPE === 'sqlite') {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || 'database.sqlite',
      logging: false,
    });
  } else {
    throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}`);
  }

  // import models
  User = require('./user')(sequelize);
  Category = require('./category')(sequelize);
  Course = require('./course')(sequelize);
  Learning = require('./learning')(sequelize);
  Progress = require('./progress')(sequelize);
  Assessment = require('./assessment')(sequelize);
  Question = require('./question')(sequelize);
  Discussion = require('./discussion')(sequelize);
  Feedback = require('./feedback')(sequelize);
  Certificate = require('./certificate')(sequelize);
  Notification = require('./notification')(sequelize);
}

module.exports = { DB_TYPE, sequelize, mongoose, User, Category, Course, Learning, Progress, Assessment, Question, Discussion, Feedback, Certificate, Notification };
