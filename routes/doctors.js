const DoctorController = require("../controllers/doctorController");
const router = require("express").Router();

router.get("/dashboard", DoctorController.dashboardDoc);
// router.post("/dashboard", DoctorController.dashboardDoc);
router.patch("/availability", DoctorController.toggleAvailability);
router.get("/bookings/pending", DoctorController.getPendingBookings);
router.patch("/bookings/:chatRoomId/approve", DoctorController.approveBooking);
router.patch("/bookings/:chatRoomId/reject", DoctorController.rejectBooking);
router.get("/", DoctorController.getAll);


module.exports = router;
