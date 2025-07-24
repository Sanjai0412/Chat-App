const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://Sanjai:mongodb.shit@sanjaicluster.cuuzvpp.mongodb.net/?retryWrites=true&w=majority&appName=SanjaiCluster"
  )
  .then(() => console.log("Database connected"))
  .catch((e) => console.log("Not Connected", e));

const ACTION = {
  SUCCESS: "SUCCESS",
  WRONG: "WRONG",
  EMPTY: "EMPTY",
  NOT_FOUND: "NOT_FOUND",
  LOGOUT: "LOGOUT",
};

const loginSchema = new mongoose.Schema({
  username: String,
  attemptTime: Date,
  status: Boolean,
  message: String,
});

const signUpSchema = new mongoose.Schema({
  username: String,
  userId: String,
  email: String,
  password: String,
});

const messageSchema = new mongoose.Schema({
  from: String,
  message: String,
  to: String,
  time: Date,
});

const loginModel = mongoose.model("loginDetails", loginSchema);
const signUpModel = mongoose.model("userDetails", signUpSchema);
const messageModel = mongoose.model("messages", messageSchema);

module.exports = { loginModel, signUpModel, messageModel, ACTION };
