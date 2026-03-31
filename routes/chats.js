const router = require("express").Router();

const ChatController = require("../controllers/chatController");

router.get("/chats", ChatController.getListChatRooms);
router.get("/chats/:chatRoomId/messages", ChatController.getMessages);
router.get("/chats/:chatRoomId", ChatController.getChatRoom);
router.post(
  "/chats/:chatRoomId/messages",
  ChatController.createMessage,
);
router.post("/", ChatController.createBooking);
router.get("/", ChatController.getMyBookings);
router.patch("/:chatRoomId/rating", ChatController.rateClosedBooking);

module.exports = router;
