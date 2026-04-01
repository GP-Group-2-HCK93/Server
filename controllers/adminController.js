const { User, Doctor } = require('../models/index');

class AdminController {
  // GET /users
  static async getUsers(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['id', 'ASC']],
      });

      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  // PUT /users/:id
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, profilePic, role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      await user.update({ name, profilePic, role });

      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /users/:id
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      await user.destroy();

      res.status(200).json({ message: `User ${user.name} has been deleted` });
    } catch (error) {
      next(error);
    }
  }

  // GET /doctors
  static async getDoctors(req, res, next) {
    try {
      const doctors = await Doctor.findAll({
        include: {
          model: User,
          attributes: { exclude: ['password'] },
        },
        order: [['id', 'ASC']],
      });

      res.status(200).json(doctors);
    } catch (error) {
      next(error);
    }
  }

  // PUT /doctors/:id
  static async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const { specialization, experience, bio, isAvailable, location } = req.body;

      const doctor = await Doctor.findByPk(id);
      if (!doctor) {
        throw { name: 'NotFound', message: 'Doctor not found' };
      }

      await doctor.update({ specialization, experience, bio, isAvailable, location });

      const updated = await Doctor.findByPk(id, {
        include: {
          model: User,
          attributes: { exclude: ['password'] },
        },
      });

      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /doctors/:id
  static async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;

      const doctor = await Doctor.findByPk(id, {
        include: {
          model: User,
          attributes: ['id', 'name'],
        },
      });

      if (!doctor) {
        throw { name: 'NotFound', message: 'Doctor not found' };
      }

      const doctorName = doctor.User.name;

      await doctor.destroy();
      await User.destroy({ where: { id: doctor.UserId } });

      res.status(200).json({ message: `Doctor ${doctorName} has been deleted` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
