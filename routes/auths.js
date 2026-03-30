const AuthController = require("../controllers/authController");
const authentication = require("../middlewares/authentication");
const guardAdmin = require("../middlewares/authorization");
const router = require("express").Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/doctor-register", authentication, guardAdmin, AuthController.docRegister);

module.exports = router;
