const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: DataTypes.TEXT,
    type: DataTypes.STRING,
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    related_entity_type: DataTypes.STRING,
    related_entity_id: DataTypes.INTEGER,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'notification',
    timestamps: false,
    indexes: [{ fields: ['user_id','is_read'], name: 'idx_user_read' }, { fields: ['created_at'], name: 'idx_created_at' }]
  });

  return Notification;
};