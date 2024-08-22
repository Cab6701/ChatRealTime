const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
  addFriend,
  getUserById
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, allUsers);
router.route("/:userId").get(protect, getUserById);
router.route("/").post(registerUser);
router.post("/login", authUser);
router.put("/addFriend", addFriend);

module.exports = router;
