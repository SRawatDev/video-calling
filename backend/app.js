// server/server.js (Node.js + Express)
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080","http://192.168.100.53:8080/","https://video-calling-iota.vercel.app/"],
    methods: ["GET", "POST"],
  },
});

mongoose.connect("mongodb://localhost:27017/video-call", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
});
app.get("/",(req,res)=>{
  res.send("hiii")
})
const User = mongoose.model("User", userSchema);

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("join-room", async (roomId, userId) => {
    await User.create({ userId, roomId });
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", async () => {
      await User.deleteOne({ userId });
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(4000, () => console.log("Server running on port 4000"));

