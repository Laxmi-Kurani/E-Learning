const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Learning = sequelize.define('Learning', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    approved_at: DataTypes.DATE,
    approved_by: DataTypes.INTEGER,
  }, {
    tableName: 'learning',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user_id','course_id'], name: 'unique_enrollment' }]
  });

  return Learning;
};