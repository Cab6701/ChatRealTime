const jwt = require("jsonwebtoken");
const getToken = (req, res) => {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

    const options = { expiresIn: "10m", algorithm: "HS256" };

    const payload = {
        apikey: API_KEY,
        permissions: ["allow_join", "allow_mod"], // also accepts "ask_join"
    };

    const token = jwt.sign(payload, SECRET_KEY, options);
    res.json({ token });
}

const createMeeting = async (req, res) => {
    const { token, region } = req.body;
    const url = `${process.env.VIDEOSDK_API_ENDPOINT}/v2/rooms`;
    const options = {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
    };

    await fetch(url, options)
        .then((response) => response)
        .then((result) => res.json(result)) // result will contain meetingId
        .catch((error) => console.error("error", error));
}

const validateMeeting = (req, res) => {
    const token = req.body.token;
    const meetingId = req.params.meetingId;

    const url = `${process.env.VIDEOSDK_API_ENDPOINT}/api/meetings/${meetingId}`;

    const options = {
        method: "POST",
        headers: { Authorization: token },
    };

    fetch(url, options)
        .then((response) => response.json())
        .then((result) => res.json(result)) // result will contain meetingId
        .catch((error) => console.error("error", error));
}

module.exports = { getToken, createMeeting, validateMeeting };