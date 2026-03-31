const router = require("express").Router()
const authentication = require("../middlewares/authentication")
const authRoutes = require("./auths")
const chatRoutes = require("./chats")
const aiRoutes = require("./ai")
const doctorRoutes = require("./doctors");
const bookingRoutes = require("./booking");

router.use("/", authRoutes);

router.use(authentication)
// router.use("/chats", chatRoutes)
router.use("/ai", aiRoutes)

router.use("/doctors", doctorRoutes);
router.use("/", chatRoutes);
router.use("/", bookingRoutes);

module.exports = router;
