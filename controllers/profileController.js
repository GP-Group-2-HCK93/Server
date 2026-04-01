const { User, Doctor } = require('../models/index');

class ProfileController {
  // GET /profile
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: {
          model: Doctor,
          required: false,
        },
      });

      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  // PUT /profile
  static async updateProfile(req, res, next) {
    try {
      const { name, profilePic, specialization, experience, bio, location, isAvailable } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      // Update user data
      await user.update({ name, profilePic });

      // If user is a Doctor, update doctor data too
      if (req.user.role === 'Doctor') {
        const doctor = await Doctor.findOne({ where: { UserId: req.user.id } });
        if (doctor) {
          await doctor.update({ specialization, experience, bio, location, isAvailable });
        }
      }

      // Fetch updated data
      const updated = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: {
          model: Doctor,
          required: false,
        },
      });

      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
