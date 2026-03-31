const { Doctor, User } = require("../models/index");

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
}

module.exports = DoctorController;