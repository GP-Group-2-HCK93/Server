const BookingController = require("../controllers/bookingController");

const router = require("express").Router();

router.post("/bookings", BookingController.createBooking);
router.get("/bookings", BookingController.getMyBookings);
router.post("/", BookingController.createBooking);
router.get("/", BookingController.getMyBookings);
router.patch("/:chatRoomId/rating", BookingController.rateClosedBooking);

module.exports = router;