const { ChatRoom, Doctor, User, Notification, Message } = require("../models/index");
const { Op } = require("sequelize");

class ChatController {
  static ratingType(doctorId, chatRoomId) {
    return `CHAT_RATING_${doctorId}_${chatRoomId}`;
  }

  static async updateDoctorRating(doctorId) {
    const ratingNotifications = await Notification.findAll({
      where: {
        type: {
          [Op.like]: `CHAT_RATING_${doctorId}_%`,
        },
      },
      attributes: ["message"],
    });

    const ratingValues = ratingNotifications
      .map((item) => Number(item.message))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 5);

    const averageRating = ratingValues.length
      ? Number(
          (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(2)
        )
      : 0;

    await Doctor.update({ rating: averageRating }, { where: { id: doctorId } });
    return averageRating;
  }

  static async createBooking(req, res, next) {
    try {
      const { chatRoomId } = req.params;

      if (!DoctorId) {
        throw { name: "BadRequest", message: "DoctorId is required" };
      }

      const doctor = await Doctor.findByPk(DoctorId);
      if (!doctor) {
        throw { name: "NotFound", message: "Doctor not found" };
      }

      const existingActiveBooking = await ChatRoom.findOne({
        where: {
          UserId,
          DoctorId,
          status: {
            [Op.in]: ["Pending", "Accepted"],
          },
        },
      });

      if (existingActiveBooking) {
        throw {
          name: "BadRequest",
          message: "You already have an active booking with this doctor",
        };
      }

      const chatRoom = await ChatRoom.create({
        UserId,
        DoctorId,
        status: "Pending",
      });

      const io = req.app.get("io");
      io.to(`chat:${chatRoomId}`).emit("message:new", newMessage);

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("❌ Error creating message:", error);
      next(error);
    }
  }
  static async getMyBookings(req, res, next) {
    try {
      const UserId = req.user.id;

      const bookings = await ChatRoom.findAll({
        where: { UserId },
        include: {
          model: Doctor,
          attributes: ["id", "specialization", "experience", "isAvailable", "location", "rating"],
          include: {
            model: User,
            attributes: ["name", "email", "profilePic"],
          },
        },
      });

      const ratingNotifications = await Notification.findAll({
        where: {
          UserId,
          type: {
            [Op.like]: "CHAT_RATING_%",
          },
        },
        attributes: ["type", "message"],
      });

      const ratingByChatRoomId = {};
      for (const item of ratingNotifications) {
        const parts = String(item.type || "").split("_");
        const chatRoomId = Number(parts[parts.length - 1]);
        const rating = Number(item.message);
        if (Number.isInteger(chatRoomId) && Number.isInteger(rating)) {
          ratingByChatRoomId[chatRoomId] = rating;
        }
      }

      res.status(200).json(
        bookings.map((booking) => ({
          ...booking.toJSON(),
          userRating: ratingByChatRoomId[booking.id] || null,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
  
  static async rateClosedBooking(req, res, next) {
    try {
      const UserId = req.user.id;
      const { chatRoomId } = req.params;
      const { rating } = req.body;

      if (req.user.role !== "User") {
        throw { name: "Forbidden", message: "Only user can rate booking" };
      }

      const ratingValue = Number(rating);
      if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        throw { name: "BadRequest", message: "rating must be an integer between 1 and 5" };
      }

      const booking = await ChatRoom.findOne({
        where: {
          id: chatRoomId,
          UserId,
        },
      });

      if (!booking) {
        throw { name: "NotFound", message: "Booking not found" };
      }

      if (booking.status !== "Closed") {
        throw { name: "BadRequest", message: "Only closed booking can be rated" };
      }

      const type = ChatController.ratingType(booking.DoctorId, booking.id);
      const existingRating = await Notification.findOne({
        where: {
          UserId,
          type,
        },
      });

      if (existingRating) {
        await existingRating.update({
          message: String(ratingValue),
          isRead: true,
        });
      } else {
        await Notification.create({
          UserId,
          type,
          message: String(ratingValue),
          isRead: false,
        });
      }

      const updatedAverage = await ChatController.updateDoctorRating(booking.DoctorId);

      res.status(200).json({
        message: "Rating submitted",
        chatRoomId: booking.id,
        rating: ratingValue,
        doctorAverageRating: updatedAverage,
      });
    } catch (error) {
      next(error);
    }
  }
  
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
