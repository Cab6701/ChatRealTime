const jwt = require("jsonwebtoken");
const getToken = (req, res) => {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;
  const options = { expiresIn: "120m", algorithm: "HS256" };
  const payload = {
    apikey: API_KEY,
    permissions: ["allow_join", "allow_mod"],
  };

  const token = jwt.sign(payload, SECRET_KEY, options);
  res.json({ token });
};

const createMeeting = async (req, res) => {
  const { token } = req.body;
  const url = `${process.env.VIDEOSDK_API_ENDPOINT}/v2/rooms`;
  const options = {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }
    const result = await response.json();
    console.log("Create meeting ===> " + result);
    return res.json({ roomId: result.roomId });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while creating the meeting" });
  }
};

const validateMeeting = async (req, res) => {
  const { token, roomId } = req.body;
  const url = `${process.env.VIDEOSDK_API_ENDPOINT}/v2/rooms/validate/${roomId}`;
  const options = {
    method: "GET",
    headers: { Authorization: token, "Content-Type": "application/json" },
  };

  const response = await fetch(url, options);
  if (response.status === 400) {
    const data = await response.text();
    return { roomId: null, err: data };
  }

  const data = await response.json();
  console.log("Result:", JSON.stringify(data, null, 2));
  return res.json({ roomId: data.roomId });
};

module.exports = { getToken, createMeeting, validateMeeting };
