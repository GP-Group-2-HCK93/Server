const { ChatRoom, Doctor, User } = require("../models");

class DoctorController {
  static async getAll(req, res, next) {
    try {
      const doctors = await Doctor.findAll({
        where: {
          isAvailable: true,
        },
        include: {
          model: User,
          attributes: ["name", "email", "profilePic"],
        },
      });

      res.status(200).json(doctors);
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorProfile(userId) {
    const doctor = await Doctor.findOne({
      where: { UserId: userId },
      include: {
        model: User,
        attributes: ["id", "name", "email", "profilePic"],
      },
    });

    if (!doctor) {
      throw { name: "NotFound", message: "Doctor profile not found" };
    }

    return doctor;
  }

  static ensureDoctorRole(req) {
    if (req.user.role !== "Doctor") {
      throw { name: "Forbidden", message: "You're not authorized" };
    }
  }

  static async dashboardDoc(req, res, next) {
    try {
      DoctorController.ensureDoctorRole(req);

      const doctor = await DoctorController.getDoctorProfile(req.user.id);

      const [
        totalChats,
        pendingChats,
        acceptedChats,
        closedChats,
        totalPatients,
      ] = await Promise.all([
        ChatRoom.count({ where: { DoctorId: doctor.id } }),
        ChatRoom.count({ where: { DoctorId: doctor.id, status: "Pending" } }),
        ChatRoom.count({ where: { DoctorId: doctor.id, status: "Accepted" } }),
        ChatRoom.count({ where: { DoctorId: doctor.id, status: "Closed" } }),
        ChatRoom.count({
          where: { DoctorId: doctor.id },
          distinct: true,
          col: "UserId",
        }),
      ]);

      res.status(200).json({
        doctor: {
          id: doctor.id,
          name: doctor.User.name,
          email: doctor.User.email,
          profilePic: doctor.User.profilePic,
          specialization: doctor.specialization,
          experience: doctor.experience,
          bio: doctor.bio,
          location: doctor.location,
          isAvailable: doctor.isAvailable,
          rating: doctor.rating,
        },
        summary: {
          totalPatients,
          totalChats,
          pendingChats,
          acceptedChats,
          closedChats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleAvailability(req, res, next) {
    try {
      DoctorController.ensureDoctorRole(req);

      const doctor = await DoctorController.getDoctorProfile(req.user.id);

      const nextAvailability =
        typeof req.body?.isAvailable === "boolean"
          ? req.body.isAvailable
          : !doctor.isAvailable;

      await doctor.update({ isAvailable: nextAvailability });

      res.status(200).json({
        message: `Doctor is now ${doctor.isAvailable ? "available" : "unavailable"}`,
        isAvailable: doctor.isAvailable,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingBookings(req, res, next) {
    try {
      DoctorController.ensureDoctorRole(req);

      const doctor = await DoctorController.getDoctorProfile(req.user.id);

      const bookings = await ChatRoom.findAll({
        where: {
          DoctorId: doctor.id,
          status: "Pending",
        },
        include: [
          {
            model: User,
            attributes: ["id", "name", "email", "profilePic"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        total: bookings.length,
        bookings: bookings.map((booking) => ({
          id: booking.id,
          status: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          patient: booking.User
            ? {
                id: booking.User.id,
                name: booking.User.name,
                email: booking.User.email,
                profilePic: booking.User.profilePic,
              }
            : null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveBooking(req, res, next) {
    try {
      DoctorController.ensureDoctorRole(req);
      const { chatRoomId } = req.params;

      const doctor = await DoctorController.getDoctorProfile(req.user.id);

      const booking = await ChatRoom.findOne({
        where: {
          id: chatRoomId,
          DoctorId: doctor.id,
        },
      });

      if (!booking) {
        throw { name: "NotFound", message: "Booking not found" };
      }

      if (booking.status !== "Pending") {
        throw { name: "BadRequest", message: "Booking is not pending anymore" };
      }

      await booking.update({ status: "Accepted" });

      res.status(200).json({
        message: "Booking approved",
        booking: {
          id: booking.id,
          status: booking.status,
          updatedAt: booking.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectBooking(req, res, next) {
    try {
      DoctorController.ensureDoctorRole(req);
      const { chatRoomId } = req.params;

      const doctor = await DoctorController.getDoctorProfile(req.user.id);

      const booking = await ChatRoom.findOne({
        where: {
          id: chatRoomId,
          DoctorId: doctor.id,
        },
      });

      if (!booking) {
        throw { name: "NotFound", message: "Booking not found" };
      }

      if (booking.status !== "Pending") {
        throw { name: "BadRequest", message: "Booking is not pending anymore" };
      }

      await booking.update({ status: "Rejected" });

      res.status(200).json({
        message: "Booking rejected",
        booking: {
          id: booking.id,
          status: booking.status,
          updatedAt: booking.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
