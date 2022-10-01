import cors from "cors";
import { config } from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import userRoute from "./routes/userRoute.js";
config();

// Routes

import login from "./auth/login.js";
import postRoute from "./routes/postRoute.js";

// ===

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

// Middlewares

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===

// Routes

app.use("/", login);
app.use("/", userRoute);
app.use("/", postRoute);

//
app.get("/", (req, res) => {
  res.send("App is running");
});

// app.post("/", async (req, res) => {
//   const models = mongoose.models;
//   const posts = await models.User.updateMany(
//     {},
//     {
//       $set: { points: 0 },
//     },
//     { new: true }
//   );
//   return res.status(200).json(posts);
// });

mongoose.connect(process.env.MONGO_URL, { dbName: "tenter" }, () =>
  console.log("MongoDB has been connected")
);

// Socket io
let users = [];

const addUser = (currentUser, socketId) => {
  return (
    !users.some((user) => user._id === currentUser._id) &&
    users.push({ ...currentUser, socketId })
  );
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  return users;
};

io.on("connection", (socket) => {
  socket.on("user", (user) => {
    addUser(user, socket.id);
    console.log(users);
  });

  socket.on("questionPoint", (data) => {
    let currentUser;
    users = users.map((user) => {
      if (user._id === data.userId) {
        user.points += data.value;
        currentUser = user;
        return user;
      }
      return user;
    });
    console.log(users);
    socket.broadcast.emit("sendQuestionPoint", currentUser);
  });

  socket.on("commentPoint", (data) => {
    let currentUser;
    users = users.map((user) => {
      if (user._id === data.userId) {
        user.points += data.value;
        currentUser = user;
        return user;
      }
      return user;
    });
    console.log(data);
    socket.broadcast.emit("sendCommentPoint", currentUser);
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

server.listen(process.env.PORT || 4000, () => console.log("App is running"));
