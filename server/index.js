import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// Map socket.id -> { id, name }
const users = new Map();

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  // send current users to all clients
  const broadcastUsers = () => {
    const list = Array.from(users.values());
    io.emit("users", list);
  };

  socket.on("register", (payload) => {
    const { name } = payload || {};
    users.set(socket.id, { id: socket.id, name: name || "Anonymous" });
    broadcastUsers();
    console.log("registered", socket.id, name);
  });

  socket.on("private_message", (msg) => {
    // msg: { to, content, from, timestamp, fromName }
    const { to } = msg;
    if (!to) return;
    // send to target socket id
    io.to(to).emit("private_message", msg);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    broadcastUsers();
    console.log("socket disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running");
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
