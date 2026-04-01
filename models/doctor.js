"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Doctor.belongsTo(models.User, { foreignKey: "UserId" });
      Doctor.hasMany(models.ChatRoom, { foreignKey: "DoctorId" });
      Doctor.hasMany(models.Message, {
        foreignKey: "SenderId",
        as: "SentMessages",
      });
    }
  }
  Doctor.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "User Id is required",
          },
          notNull: {
            msg: "User Id is required",
          },
        },
      },
      specialization: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Specialization is required",
          },
          notNull: {
            msg: "Specialization is required",
          },
        },
      },
      experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Number of experience is required",
          },
          notNull: {
            msg: "Number of experience is required",
          },
        },
      },
      bio: { type: DataTypes.STRING, allowNull: true },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Availability is required",
          },
          notNull: {
            msg: "Availability is required",
          },
        },
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 5,
        validate: {
          notEmpty: {
            msg: "Rating is required",
          },
          notNull: {
            msg: "Rating is required",
          },
        },
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Location is required",
          },
          notNull: {
            msg: "Location is required",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Doctor",
    },
  );
  return Doctor;
};
