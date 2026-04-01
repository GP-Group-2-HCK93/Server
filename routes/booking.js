const BookingController = require("../controllers/bookingController");

const router = require("express").Router();

router.post("/bookings", BookingController.createBooking);
router.get("/bookings", BookingController.getMyBookings);
router.patch("/bookings/:chatRoomId/rating", BookingController.rateClosedBooking);
router.post("/", BookingController.createBooking);
router.get("/", BookingController.getMyBookings);
router.patch("/chats/:chatRoomId/rating", BookingController.rateClosedBooking);
router.patch("/:chatRoomId/rating", BookingController.rateClosedBooking);

module.exports = router;