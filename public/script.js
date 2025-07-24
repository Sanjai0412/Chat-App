const socket = io();
let receiverSocketId;

const usernameInput = document.getElementById("email-input");
let userList = document.getElementById("userList");
let receiverNameDiv = document.getElementById("receiver-name");
let user;
const chatContainer = document.getElementById("messages");
let seenMsgDiv;

let onlineMsg = document.createElement("div");
onlineMsg.classList.add("online-message");
onlineMsg.innerText = "online";

// select receiver
document.getElementById("select-btn").addEventListener("click", (e) => {
  const receiverName = document.getElementById("receiver-input").value;
  if (receiverName) {
    socket.emit("receiver-name", receiverName);
    receiverNameDiv.innerText = receiverName;

    receiverNameDiv.appendChild(onlineMsg);
  }
});
// Send message
document.getElementById("sendBtn").addEventListener("click", sendMessage());
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

function sendMessage(e) {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput.value;
  const date = new Date();
  messageInput.value = "";
  socket.emit("private-message", { receiverSocketId, message, date });
}

document.getElementById("loginBtn").addEventListener("click", (e) => {
  const username = usernameInput.value;
  const password = document.getElementById("password-input").value;
  console.log(username);
  socket.emit("login-validation", { username, password });

  socket.on("user-name", (socketUsername) => {
    user = socketUsername;
  });
  socket.on("login-successful", (username) => {
    if (username) {
      socket.emit("new-user", username);
      document.getElementById("session-username").innerText = username;
      document.getElementsByClassName("username-container")[0].style.display =
        "none";
    }
  });
});

// Receive receiver id
socket.on("receiver-id", (receiverId) => {
  receiverSocketId = receiverId;
});

// update chat history
socket.on("chat-history", (chats) => {
  chatContainer.innerHTML = "";
  let old = true;
  if (Array.isArray(chats)) {
    chats.forEach((chat) => {
      let time = chat.time;
      chatContainer.append(
        createChatMessage(chat.from, chat.message, time, old)
      );
      chatContainer.scrollTop = chatContainer.scrollHeight;
      console.log(chats);
    });
  } else {
    console.log("Chats is not an array");
    // console.log(chats);
  }
});

// Receive private message
socket.on("message", (data) => {
  alert(`${data.user} : ${data.message}`);
  socket.emit("fetch-and-update", receiverSocketId);
});

socket.on("user-list", (users) => {
  createUserList(users);
});

socket.on("inform-to-all", (data) => {
  //  console.log(data);
});

// to check the message was seen or not
socket.on("seen-message", (name) => {
  if (name) {
    console.log("message seen");
    // seenMsgDiv.innerText = '✓✓';
  }
});

function createChatMessage(username, message, date, old) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-item";

  const usernameDiv = document.createElement("div");
  usernameDiv.style.fontWeight = "bold";
  usernameDiv.innerText = username;

  const messageTextDiv = document.createElement("div");
  messageTextDiv.innerText = message;

  const dateDiv = document.createElement("div");
  dateDiv.classList.add("date");
  dateDiv.innerText = new Date(date).toLocaleTimeString();

  // messageDiv.appendChild(usernameDiv);
  messageDiv.appendChild(messageTextDiv);
  messageDiv.appendChild(dateDiv);

  if (username === user) {
    messageDiv.classList.add("sender");
    seenMsgDiv = document.createElement("div");
    seenMsgDiv.className = "seen-message";
    if (old) {
      seenMsgDiv.innerText = "✓✓";
    } else {
      seenMsgDiv.innerText = "✓";
    }

    dateDiv.append(seenMsgDiv);
  } else {
    socket.emit("message-seen", { user, receiverSocketId });
    messageDiv.classList.add("receiver");
  }

  return messageDiv;
}
let li;
function createUserList(users) {
  userList.innerHTML = "";

  Object.values(users).forEach((element) => {
    li = document.createElement("li");
    li.innerText = element;

    userList.append(li);
  });
}

userList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    socket.emit("receiver-name", e.target.innerText);
    receiverNameDiv.innerText = e.target.innerText;

    receiverNameDiv.appendChild(onlineMsg);
  }
});
