const doctorController = require("../controllers/doctorController");
const router = require("express").Router();

router.get("/dashboard", doctorController.dashboardDoc);
// router.post("/dashboard", doctorController.dashboardDoc);
router.patch("/availability", doctorController.toggleAvailability);

module.exports = router;
