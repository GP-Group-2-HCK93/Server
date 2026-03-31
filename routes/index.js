const router = require("express").Router()
const authentication = require("../middlewares/authentication")
const authRoutes = require("./auths")
const chatRoutes = require("./chats")
const aiRoutes = require("./ai")

router.use("/", authRoutes)

router.use(authentication)
router.use("/chats", chatRoutes)
router.use("/ai", aiRoutes)

module.exports = router
