const { ChatRoom, Doctor, User } = require("../models");

class DoctorController {
  static async dashboardDoc(req, res, next) {
    try {
      if (req.user.role !== "Doctor") {
        throw { name: "Forbidden", message: "You're not authorized" };
      }

      const doctor = await Doctor.findOne({
        where: { UserId: req.user.id },
        include: {
          model: User,
          attributes: ["id", "name", "email", "profilePic"],
        },
      });

      if (!doctor) {
        throw { name: "NotFound", message: "Doctor profile not found" };
      }

      const [totalChats, pendingChats, acceptedChats, closedChats, totalPatients] =
        await Promise.all([
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
      if (req.user.role !== "Doctor") {
        throw { name: "Forbidden", message: "You're not authorized" };
      }

      const doctor = await Doctor.findOne({
        where: { UserId: req.user.id },
      });

      if (!doctor) {
        throw { name: "NotFound", message: "Doctor profile not found" };
      }

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
}

module.exports = DoctorController;
