const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (email === "" || password === "") {
    message.textContent = "Please fill in all fields.";
    return;
  }

  if (password.length < 6) {
    message.textContent = "Password must contain at least 6 characters.";
    return;
  }

  message.style.color = "#16a34a";
  message.textContent = "Login successful!";
});