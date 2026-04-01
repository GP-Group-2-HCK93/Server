const { ChatRoom, Doctor, User, Notification } = require("../models/index");
const { Op } = require("sequelize");

class BookingController {
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
      const {DoctorId }= req.body
      const UserId = req.user.id

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

      res.status(201).json(chatRoom);
    } catch (error) {
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

      const type = BookingController.ratingType(booking.DoctorId, booking.id);
      const existingRating = await Notification.findOne({
        where: {
          UserId,
          type,
        },
      });

      if (existingRating) {
        throw { name: "BadRequest", message: "You have already rated this booking" };
      }

      await Notification.create({
        UserId,
        type,
        message: String(ratingValue),
        isRead: false,
      });

      const updatedAverage = await BookingController.updateDoctorRating(booking.DoctorId);

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
}

module.exports = BookingController;