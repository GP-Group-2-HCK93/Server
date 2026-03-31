const doctorController = require("../controllers/doctorController");
const router = require("express").Router();

router.get("/dashboard", doctorController.dashboardDoc);
// router.post("/dashboard", doctorController.dashboardDoc);
router.patch("/availability", doctorController.toggleAvailability);
router.get("/bookings/pending", doctorController.getPendingBookings);
router.patch("/bookings/:chatRoomId/approve", doctorController.approveBooking);
router.patch("/bookings/:chatRoomId/reject", doctorController.rejectBooking);

module.exports = router;
