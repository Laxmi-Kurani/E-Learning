const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    instructor: DataTypes.STRING,
    duration: DataTypes.STRING,
    level: DataTypes.STRING,
    category: DataTypes.STRING,
    image_url: DataTypes.TEXT,
    video_url: DataTypes.TEXT,
    price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  }, {
    tableName: 'course',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Course;
};