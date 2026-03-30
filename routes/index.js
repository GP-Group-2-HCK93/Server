const router = require("express").Router()
const authentication = require("../middlewares/authentication")
const authRoutes = require("./auths")

router.use("/", authRoutes)

router.use(authentication)

module.exports = router