const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    mobileNumber: { type: DataTypes.STRING },
    dob: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    profession: { type: DataTypes.STRING },
    linkedin_url: { type: DataTypes.STRING },
    github_url: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'USER' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    profile_image: { type: DataTypes.STRING },
  }, {
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return User;
};
