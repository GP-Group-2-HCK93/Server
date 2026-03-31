const { ChatRoom, Doctor, User, Message } = require("../models/index");

class ChatController {
  //indra
  static async getChatRoom(req, res, next) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const chatRoom = await ChatRoom.findByPk(chatRoomId, {
        include: [
          {
            model: Doctor,
            attributes: [
              "id",
              "specialization",
              "experience",
              "isAvailable",
              "location",
              "rating",
            ],
            include: {
              model: User,
              attributes: ["id", "name", "email", "profilePic"],
            },
          },
          {
            model: User,
            attributes: ["id", "name", "email", "profilePic"],
          },
        ],
      });

      if (!chatRoom) {
        return res.status(404).json({ message: "Chat room not found" });
      }

      // Optional: verify user has access
      const userRole = req.user.role;
      if (userRole === "User" && chatRoom.UserId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (userRole === "Doctor") {
        const doctor = await Doctor.findOne({ where: { UserId: userId } });
        if (!doctor || chatRoom.DoctorId !== doctor.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      res.status(200).json(chatRoom);
    } catch (error) {
      next(error);
    }
  }

  static async getListChatRooms(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log("👤 User:", { userId, userRole }); // ✅ DEBUG

      let whereCondition = {};

      if (userRole === "Doctor") {
        // ✅ Cari Doctor record by UserId
        const doctor = await Doctor.findOne({ where: { UserId: userId } });
        console.log("🏥 Doctor found:", doctor); // ✅ DEBUG

        if (!doctor) {
          return res.status(200).json([]);
        }

        whereCondition = { DoctorId: doctor.id };
      } else {
        // User biasa
        whereCondition = { UserId: userId };
      }

      console.log("🔍 Where condition:", whereCondition); // ✅ DEBUG

      const chatRooms = await ChatRoom.findAll({
        where: whereCondition,
        include: [
          {
            model: Doctor,
            attributes: [
              "id",
              "specialization",
              "experience",
              "isAvailable",
              "location",
              "rating",
            ],
            include: {
              model: User,
              attributes: ["id", "name", "email", "profilePic"],
            },
          },
          {
            model: User,
            attributes: ["id", "name", "email", "profilePic"],
          },
        ],
      });

      console.log("📋 Chat rooms found:", chatRooms.length); // ✅ DEBUG
      res.status(200).json(chatRooms);
    } catch (error) {
      console.error("❌ Error:", error);
      next(error);
    }
  }
 
    static async getMessages(req, res, next) {
    try {
      const { chatRoomId } = req.params;

      const messages = await Message.findAll({
        where: { ChatRoomId: chatRoomId },
        include: [
          {
            model: User,
            as: "SenderUser", // ✅ ADD THIS
            attributes: ["id", "name", "email"],
          },
          {
            model: Doctor,
            as: "SenderDoctor", // ✅ ADD THIS
            attributes: ["id"],
            include: {
              model: User,
              attributes: ["id", "name", "email"],
            },
          },
        ],
        order: [["createdAt", "ASC"]],
      });

      res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }
  
    static async createMessage(req, res, next) {
    try {
      const { chatRoomId } = req.params;
      const { message } = req.body;
      const SenderId = req.user.id;
      const senderRole = req.user.role;

      console.log("📨 Message received:", {
        chatRoomId,
        message,
        SenderId,
        senderRole,
      });

      if (!message || !message.trim()) {
        console.log("❌ Message validation failed");
        return res.status(400).json({
          error: "Message is required",
          received: message,
          body: req.body,
        });
      }

      const chatRoom = await ChatRoom.findByPk(chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({ error: "Chat room not found" });
      }

      const newMessage = await Message.create({
        ChatRoomId: chatRoomId,
        SenderId,
        senderRole, // ✅ ADD THIS
        message: message.trim(),
      });

      const io = req.app.get("io");
      io.to(`chat:${chatRoomId}`).emit("message:new", newMessage);

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("❌ Error creating message:", error);
      next(error);
    }
  }
  
}

module.exports = ChatController;
