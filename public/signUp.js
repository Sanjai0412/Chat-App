const socket = io();
let users = [];

function signUp() {
  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  if (!username || !email || !password) {
    alert("All fields are required!");
    return;
  }

  let userDetails = {
    username: username,
    email: email,
    password: password,
  };

  socket.emit("signup-validation", userDetails);
}

socket.on("email-exists", (email) => {
  alert(`${email} email already exists`);
});

socket.on("signup-error", (message) => {
  alert(message);
});

socket.on("email-not-exists", (email) => {
  console.log("User signed up successfully");
  alert("Signup successful!");

  document.getElementById("username").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  window.location.href = "/";
});
