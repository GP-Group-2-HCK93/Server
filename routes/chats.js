const router = require("express").Router();

const ChatController = require("../controllers/chatController");

router.post("/", ChatController.createBooking);
router.get("/", ChatController.getMyBookings);
router.patch("/:chatRoomId/rating", ChatController.rateClosedBooking);

module.exports = router;
