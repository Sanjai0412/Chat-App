const express = require("express");
const { Server } = require("socket.io");
const path = require("path");
const http = require("http");
const { loginModel, signUpModel, messageModel, ACTION } = require("./config");
const shortUID = require("short-unique-id");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1904;

let users = {};
let log = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signUp.html"));
});

io.on("connection", (socket) => {
  socket.on("login-validation", async (data) => {
    let email = data.username; // Assuming username from client is the email
    const loginExists = await signUpModel.findOne({ email: email });

    if (loginExists) {
      log.username = loginExists.username;

      // Securely compare the provided password with the stored hash
      const isPasswordMatch = await bcrypt.compare(
        data.password,
        loginExists.password
      );

      if (!isPasswordMatch) {
        console.log("incorrect password");
        log.attemptTime = new Date();
        log.status = false;
        log.message = ACTION.WRONG;
      } else {
        log.attemptTime = new Date();
        log.status = true;
        log.message = ACTION.SUCCESS;

        io.emit("inform-to-all", `${loginExists.username} has joined the chat`);

        socket.emit("login-successful", loginExists.username);
        users[socket.id] = loginExists.username;

        let user = loginExists.username;
        socket.emit("user-name", user);
      }
    } else {
      log.attemptTime = new Date();
      log.status = false;
      log.message = ACTION.NOT_FOUND;
    }
    let l = new loginModel(log);
    await l.save();
  });

  socket.on("signup-validation", async (data) => {
    let email = data.email;

    // Email Domain Validation
    if (!email || !email.endsWith("@gmail.com")) {
      return socket.emit(
        "signup-error",
        "Registration failed. Only @gmail.com addresses are allowed."
      );
    }

    let emailExists = await signUpModel.findOne({ email: email });

    if (!emailExists) {
      try {
        data.userId = new shortUID({ length: 10 }).rnd();

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        data.password = hashedPassword; // Replace plain password with the hash

        let s = new signUpModel(data);
        await s.save();
        socket.emit("email-not-exists", email);
        console.log("item stored");
      } catch (e) {
        console.log("there is an error", e);
        socket.emit("signup-error", "An error occurred on the server.");
      }
    } else {
      socket.emit("email-exists", email);
    }
  });

  socket.on("receiver-name", async (receiverName) => {
    let receiverId = Object.keys(users).find(
      (id) => users[id] === receiverName
    );
    console.log(`ReceiverId : ${receiverId}`);
    socket.emit("receiver-id", receiverId);

    let chats = await messageModel.find({
      $or: [
        { $and: [{ from: users[socket.id] }, { to: users[receiverId] }] },
        { $and: [{ from: users[receiverId] }, { to: users[socket.id] }] },
      ],
    });

    socket.emit("chat-history", chats);
  });

  socket.on("private-message", async (data) => {
    let messageObj = {};
    const user = users[socket.id];
    let socketId = data.receiverSocketId;
    let message = data.message;
    let date = data.date;

    if (socketId) {
      io.to(socketId).emit("message", { user, message, date });

      messageObj.from = users[socket.id];
      messageObj.message = message;
      messageObj.to = users[socketId];
      messageObj.time = data.date;
      messageObj.seen = false;

      try {
        let m = new messageModel(messageObj);
        await m.save();
      } catch (e) {
        console.log(e.message);
      }
    }

    let chats = await messageModel.find({
      $or: [
        { $and: [{ from: users[socket.id] }, { to: users[socketId] }] },
        { $and: [{ from: users[socketId] }, { to: users[socket.id] }] },
      ],
    });
    socket.emit("chat-history", chats);
  });

  socket.on("fetch-and-update", async (receiverSocketId) => {
    let chats = await messageModel.find({
      $or: [
        { $and: [{ from: users[socket.id] }, { to: users[receiverSocketId] }] },
        { $and: [{ from: users[receiverSocketId] }, { to: users[socket.id] }] },
      ],
    });
    socket.emit("chat-history", chats);
  });

  socket.on("message-seen", (data) => {
    io.to(data.receiverSocketId).emit(
      "seen-message",
      users[data.receiverSocketId]
    );
  });

  socket.on("disconnect", async () => {
    log.username = users[socket.id];
    log.attemptTime = new Date();
    log.status = false;
    log.message = ACTION.LOGOUT;

    let l = new loginModel(log);
    await l.save();

    delete users[socket.id];
  });

  setInterval(() => {
    socket.emit("user-list", users);
  }, 2000);
});

server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
