const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Certificate = sequelize.define('Certificate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    certificate_url: DataTypes.TEXT,
    issued_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('NOT_ISSUED','ISSUED','REVOKED'), defaultValue: 'NOT_ISSUED' },
  }, {
    tableName: 'certificate',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user_id','course_id'], name: 'unique_certificate' }]
  });

  return Certificate;
};