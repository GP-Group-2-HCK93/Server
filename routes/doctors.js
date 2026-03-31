const router = require("express").Router();
const DoctorController = require("../controllers/doctorController");

router.get("/doctors", DoctorController.getAll);

module.exports = router;