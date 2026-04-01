const AuthController = require("../controllers/authController");
const authentication = require("../middlewares/authentication");
const guardAdmin = require("../middlewares/authorization");
const router = require("express").Router();
const multer = require("multer")

//! 1. Set multer
const upload = multer({ storage: multer.memoryStorage() });

router.post("/login", AuthController.login);
router.post("/register", upload.single("profilePic"), AuthController.register);
router.post("/doctor-register", authentication, guardAdmin, upload.single("profilePic"), AuthController.docRegister);

module.exports = router;
