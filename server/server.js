const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let waiting = null;

io.on("connection", (socket) => {
  console.log("New user:", socket.id);

  socket.on("join", () => {
    if (waiting) {
      socket.partner = waiting;
      waiting.partner = socket;

      socket.emit("init");
      waiting.emit("init");

      waiting = null;
    } else {
      waiting = socket;
    }
  });

  socket.on("offer", (data) => {
    if (socket.partner) socket.partner.emit("offer", data);
  });

  socket.on("answer", (data) => {
    if (socket.partner) socket.partner.emit("answer", data);
  });

  socket.on("candidate", (data) => {
    if (socket.partner) socket.partner.emit("candidate", data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (socket.partner) socket.partner.emit("disconnectPeer");
    if (waiting === socket) waiting = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
