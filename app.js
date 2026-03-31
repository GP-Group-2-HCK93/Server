if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const cors = require("cors");
const express = require("express");
const app = express();
const routes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

io.use((socket, next) => {
  const username = socket.handshake.auth?.username;
  if (!username || !String(username).trim()) {
    return next(new Error("Unauthorized: username is required"));
  }

  socket.data.username = String(username).trim();
  next();
});

io.on("connection", (socket) => {
  // console.log(socket.id);

  // socket.emit("hello", "world");

  socket.on("add/count", (args) => {
    socket.broadcast.emit("share/count", args);
  });
  socket.on("min/count", (args) => {
    socket.broadcast.emit("share/count", args);
  });

  socket.on("msg/sent", (args) => {
    const msg = String(args || "").trim();
    if (!msg) return;

    io.emit("msg/all", {
      from: socket.data.username,
      msg,
    });
  });

  // ...
});

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(errorHandler);

module.exports = { app, httpServer, io };
