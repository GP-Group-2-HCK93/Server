"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Message.belongsTo(models.ChatRoom, { foreignKey: "ChatRoomId" });
      Message.belongsTo(models.User, {
        foreignKey: "SenderId",
        as: "SenderUser",
      });
      Message.belongsTo(models.Doctor, {
        foreignKey: "SenderId",
        as: "SenderDoctor",
        constraints: false,
      });
    }
  }
  Message.init(
    {
      ChatRoomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Room Id is required",
          },
          notNull: {
            msg: "Room Id is required",
          },
        },
      },
      SenderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Sender Id is required",
          },
          notNull: {
            msg: "Sender Id is required",
          },
        },
      },
      senderRole: {
        type: DataTypes.ENUM("User", "Doctor", "Admin"),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Role is required",
          },
          notNull: {
            msg: "Role is required",
          },
        },
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Message is required",
          },
          notNull: {
            msg: "Message is required",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Message",
    },
  );
  return Message;
};
