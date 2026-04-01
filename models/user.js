'use strict';
const {
  Model
} = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasOne(models.Doctor, {foreignKey: "UserId"})
      User.hasMany(models.ChatRoom, {foreignKey: "UserId"})
      User.hasMany(models.Notification, {foreignKey: "UserId"})
      User.hasMany(models.Message, { foreignKey: "SenderId", as: "SentMessages" });
    }
  }
  User.init({
    name: {type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name is required"
        },
        notNull: {
          msg: "Name is required"
        }
      }
    },
    email: {type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: "Email has already been registered"
      },
      validate: {
        notEmpty: {
          msg: "Email is required"
        },
        notNull: {
          msg: "Email is required"
        },
        isEmail: {
          args: true,
          msg: "Invalid email format"
        }
      }
    },
    password: {type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password is required"
        },
        notNull: {
          msg: "Password is required"
        },
        len: {
          args: 6,
          msg: "Password must be at least 6 characters"
        }
      }
    },
    role: {type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "User",
      validate: {
        notEmpty: {
          msg: "Role is required"
        },
        notNull: {
          msg: "Role is required"
        }
      }
    },
    profilePic: {type: DataTypes.TEXT, // diganti dari string ke text 
      allowNull: true,
      // validate: {
      //   isUrl: {
      //     args: true,
      //     msg: "Image must be URL format"
      //   }
      // }
    }
  }, {
    sequelize,
    modelName: 'User',
  });
    User.beforeCreate((user) => {
    user.password = hashPassword(user.password);
  });
  User.beforeUpdate((user) => {
    if (user.changed("password")) {
      user.password = hashPassword(user.password);
    }
  });
  return User;
};