const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const authRoutes = require("./auths");
const doctorRoutes = require("./doctors");
const chatRoutes = require("./chats");

router.use("/", authRoutes);

router.use(authentication);

router.use("/", doctorRoutes);
router.use("/", chatRoutes)

module.exports = router;
