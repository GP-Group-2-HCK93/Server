const router = require("express").Router()
const authentication = require("../middlewares/authentication")
const authRoutes = require("./auths")
const chatRoutes = require("./chats")
const aiRoutes = require("./ai")
const authRoutes = require("./auths");
const doctorRoutes = require("./doctors");

router.use("/", authRoutes);

router.use(authentication)
router.use("/chats", chatRoutes)
router.use("/ai", aiRoutes)

router.use("/doctors", doctorRoutes);

module.exports = router;
