'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ChatRoomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ChatRooms",
          key: "id"
        },
        onDelete: "cascade",
        onUpdate: "cascade"
      },
      SenderId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      senderRole: {
        type: Sequelize.ENUM("User","Admin","Doctor"),
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Messages');
  }
};