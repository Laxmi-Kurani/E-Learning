const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Progress = sequelize.define('Progress', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    completion_percentage: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_accessed: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'progress',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user_id','course_id'], name: 'unique_progress' }]
  });

  return Progress;
};