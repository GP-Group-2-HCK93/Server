const { User, Doctor } = require("../models/index");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const cloudinary = require("../helpers/cloudinary");

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }
      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }

      const user = await User.findOne({
        where: {
          email,
        },
      });

      if (!user)
        throw { name: "Unauthorized", message: "Invalid Email/Password" };

      const checkPassword = comparePassword(password, user.password);

      if (!checkPassword)
        throw { name: "Unauthorized", message: "Invalid Email/Password" };

      const access_token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        access_token: access_token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      let profilePic = null;

      if (req.file) {
        const base64Img = req.file.buffer.toString("base64");
        const base64DataUrl = `data:${req.file.mimetype};base64,${base64Img}`;
        const uploadedImage = await cloudinary.uploader.upload(base64DataUrl);
        profilePic = uploadedImage.secure_url;
      }

      const data = await User.create({
        name: name,
        email: email,
        password: password,
        profilePic: profilePic,
      });

      res.status(201).json({
        id: data.id,
        name: name,
        email: data.email,
        role: data.role,
        profilePic: data.profilePic,
      });
    } catch (error) {
      next(error);
    }
  }
  static async docRegister(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const { specialization, experience, bio, location } = req.body;

      let profilePic = null;

      if (req.file) {
        const base64Img = req.file.buffer.toString("base64");
        const base64DataUrl = `data:${req.file.mimetype};base64,${base64Img}`;
        const uploadedImage = await cloudinary.uploader.upload(base64DataUrl);
        profilePic = uploadedImage.secure_url;
      }

      const newUser = await User.create({
        name: name,
        email: email,
        role: "Doctor",
        password: password,
        profilePic: profilePic,
      });

      const newDoctor = await Doctor.create({
        UserId: newUser.id,
        specialization: specialization,
        experience: experience,
        bio: bio,
        isAvailable: false,
        location: location,
      });

      res.status(201).json({
        id: newUser.id,
        name: name,
        email: newUser.email,
        role: newUser.role,
        profilePic: profilePic,
        specialization: newDoctor.specialization,
        experience: newDoctor.experience,
        bio: newDoctor.bio,
        isAvailable: newDoctor.isAvailable,
        rating: newDoctor.rating,
        location: newDoctor.location,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
