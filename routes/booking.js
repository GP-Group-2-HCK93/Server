const BookingController = require("../controllers/bookingController");

const router = require("express").Router();

router.post("/bookings", BookingController.createBooking);
router.get("/bookings", BookingController.getMyBookings);

module.exports = router;