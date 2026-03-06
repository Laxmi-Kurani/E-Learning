const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Assessment = sequelize.define('Assessment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
    passed: { type: DataTypes.BOOLEAN, defaultValue: false },
    completed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'assessment',
    timestamps: false,
  });

  return Assessment;
};