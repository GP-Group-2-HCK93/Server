'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatRoom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ChatRoom.belongsTo(models.User, {foreignKey: "UserId"})
      ChatRoom.belongsTo(models.Doctor, {foreignKey: "DoctorId"})
      ChatRoom.hasMany(models.Message, {foreignKey: "ChatRoomId"})
    }
  }
  ChatRoom.init({
    UserId: {type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "User Id is required"
        },
        notNull: {
          msg: "User Id is required"
        }
      }
    },
    DoctorId: {type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Doctor Id is required"
        },
        notNull: {
          msg: "Doctor Id is required"
        }
      }
    },
    status: {type: DataTypes.ENUM ("Pending","Accepted","Rejected","Closed"),
      allowNull: false,
      defaultValue: "Pending",
      validate: {
        notEmpty: {
          msg: "Status is required"
        },
        notNull: {
          msg: "Status is required"
        }
      }
    }
  }, {
    sequelize,
    modelName: 'ChatRoom',
  });
  return ChatRoom;
};