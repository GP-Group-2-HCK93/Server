const router = require("express").Router();

const ChatController = require("../controllers/chatController");

router.post("/chats", ChatController.createBooking);
router.get("/chats", ChatController.getMyBookings);

module.exports = router;
