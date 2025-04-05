const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let waiting = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("ready", () => {
    if (waiting) {
      const roomID = `${socket.id}#${waiting.id}`;
      socket.join(roomID);
      waiting.join(roomID);

      socket.emit("matched", { room: roomID });
      waiting.emit("matched", { room: roomID });

      waiting = null;
    } else {
      waiting = socket;
    }
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnect", () => {
    if (waiting && waiting.id === socket.id) {
      waiting = null;
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
