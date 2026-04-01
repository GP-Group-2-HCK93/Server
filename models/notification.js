'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Notification.belongsTo(models.User, {foreignKey: "UserId"})
    }
  }
  Notification.init({
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
    type: {type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Type is required"
        },
        notNull: {
          msg: "Type is required"
        }
      }
    },
    message: {type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Message is required"
        },
        notNull: {
          msg: "Message is required"
        }
      }
    },
    isRead: {type: DataTypes.BOOLEAN,
      allowNull: false,
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
    modelName: 'Notification',
  });
  return Notification;
};