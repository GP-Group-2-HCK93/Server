const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const authRoutes = require("./auths");
const doctorRoutes = require("./doctors");
const chatRoutes = require("./chats");
const bookingRoutes = require("./booking");

router.use("/", authRoutes);

router.use(authentication);

router.use("/", doctorRoutes);
router.use("/", chatRoutes);
router.use("/", bookingRoutes);

module.exports = router;
