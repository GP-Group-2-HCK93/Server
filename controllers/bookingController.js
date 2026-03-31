const { ChatRoom, Doctor, User } = require("../models/index");

class BookingController {
  static async createBooking(req, res, next) {
    try {
      const { DoctorId } = req.body;
      const UserId = req.user.id;

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

      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BookingController;