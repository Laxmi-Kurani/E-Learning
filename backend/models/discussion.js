const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Discussion = sequelize.define('Discussion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'discussion',
    timestamps: false,
  });

  return Discussion;
};