const router = require("express").Router();
const authentication = require("../middlewares/authentication");
const authRoutes = require("./auths");
const doctorRoutes = require("./doctors");

router.use("/", authRoutes);

router.use(authentication);
router.use("/doctors", doctorRoutes);

module.exports = router;
