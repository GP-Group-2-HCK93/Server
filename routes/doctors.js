const DoctorController = require("../controllers/doctorController");
const router = require("express").Router();

router.get("/dashboard", DoctorController.dashboardDoc);
// router.post("/dashboard", DoctorController.dashboardDoc);
router.patch("/availability", DoctorController.toggleAvailability);
router.get("/bookings/pending", DoctorController.getPendingBookings);
router.get("/bookings/recent-decisions", DoctorController.getRecentDecisions);
router.patch("/bookings/:chatRoomId/approve", DoctorController.approveBooking);
router.patch("/bookings/:chatRoomId/reject", DoctorController.rejectBooking);
router.patch("/bookings/:chatRoomId/close", DoctorController.closeBooking);
router.get("/", DoctorController.getAll);


module.exports = router;
