const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatvideoRoutes = require("./routes/chatvideoRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { Socket } = require("socket.io");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept JSON Data

app.get("/", (req, res) => {
  res.send("API is running successfully");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/chatvideo", chatvideoRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server Started on PORT ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("new friend request", (toUser, fromUser) => {
    if (!toUser[0]) return console.log("chat.users not defined");
    socket.join(toUser[0]._id);
    socket.join(fromUser._id);
    socket.in(toUser[0]._id).emit("friend request recieved", fromUser);
    console.log("Send resquest to " + toUser[0].name + " from " + fromUser.name);
  })

  socket.on("request accepted", (fromUser, toUser)=>{
    socket.in(toUser._id).emit("notif accepted", fromUser);
  })

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
