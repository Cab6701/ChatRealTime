const express = require("express");
const { getToken, createMeeting, validateMeeting } = require("../controllers/chatvideoController");


const router = express.Router();

router.route("/get-token").get(getToken);
router.route("/create-meeting").post(createMeeting);
router.route("/validate-meeting").get(validateMeeting);

module.exports = router;