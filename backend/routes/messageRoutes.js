const express = require("express");
const {
  sendMessage,
  allMessages,
  botSendMessage
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:senderId").post(protect, botSendMessage);
router.route("/:chatId").get(protect, allMessages);

module.exports = router;
