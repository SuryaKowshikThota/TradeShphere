Store.seedDemo();

if (Store.current()) {
  window.location.href = "dashboard.html";
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");
const tabs = document.querySelectorAll(".form-tab");

function showTab(name) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === name);
  });

  loginForm.hidden = name !== "login";
  registerForm.hidden = name !== "register";
  forgotForm.hidden = true;
  resetForm.hidden = true;
}

function showError(id, text) {
  const message = document.getElementById(id);
  message.textContent = text;
  message.classList.remove("success");
}

function showSuccess(id, text) {
  const message = document.getElementById(id);
  message.textContent = text;
  message.classList.add("success");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    showTab(tab.dataset.tab);
  });
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const email = document
    .getElementById("loginEmail")
    .value
    .trim()
    .toLowerCase();

  const password = document.getElementById("loginPassword").value;
  const user = Store.users()[email];

  if (!user || user.password !== password) {
    showError("loginMessage", "Email or password is incorrect.");
    return;
  }

  Store.login(email);
  window.location.href = "dashboard.html";
});

registerForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();

  const email = document
    .getElementById("registerEmail")
    .value
    .trim()
    .toLowerCase();

  const password = document.getElementById("registerPassword").value;

  if (password.length < 6) {
    showError(
      "registerMessage",
      "Password must be at least 6 characters."
    );
    return;
  }

  if (Store.users()[email]) {
    showError(
      "registerMessage",
      "An account with this email already exists. Log in instead."
    );
    return;
  }

  Store.create(name, email, password);
  Store.login(email);

  window.location.href = "dashboard.html";
});

document.getElementById("demoButton").addEventListener("click", () => {
  showTab("login");

  document.getElementById("loginEmail").value = DEMO.email;
  document.getElementById("loginPassword").value = DEMO.password;
});

/* ---------- Forgot password ---------- */

let resetEmail = "";   // the account being reset
let resetCode = "";    // the 6-digit code we gave the user

// Show step 1 (email) or step 2 (code + new password)
function showForgot(step) {
  tabs.forEach(tab => tab.classList.remove("active"));

  loginForm.hidden = true;
  registerForm.hidden = true;
  forgotForm.hidden = step !== 1;
  resetForm.hidden = step !== 2;
}

document.getElementById("forgotButton").addEventListener("click", () => {
  document.getElementById("forgotMessage").textContent = "";
  showForgot(1);
});

document.getElementById("backFromForgot").addEventListener("click", () => {
  showTab("login");
});

document.getElementById("backFromReset").addEventListener("click", () => {
  showTab("login");
});

// Step 1: check the email and make a reset code
forgotForm.addEventListener("submit", event => {
  event.preventDefault();

  const email = document
    .getElementById("forgotEmail")
    .value
    .trim()
    .toLowerCase();

  if (!Store.users()[email]) {
    showError("forgotMessage", "No account found with this email.");
    return;
  }

  resetEmail = email;
  resetCode = String(Math.floor(100000 + Math.random() * 900000));

  // A real website would email this code. We have no email server,
  // so the code is shown on the screen instead.
  document.getElementById("codeHint").textContent =
    "Demo mode: there is no email server, so your reset code is " + resetCode + ".";

  document.getElementById("resetMessage").textContent = "";
  showForgot(2);
});

// Step 2: check the code and save the new password
resetForm.addEventListener("submit", event => {
  event.preventDefault();

  const code = document.getElementById("resetCode").value.trim();
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (code !== resetCode) {
    showError("resetMessage", "That code is not correct.");
    return;
  }

  if (newPassword.length < 6) {
    showError("resetMessage", "Password must be at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showError("resetMessage", "The two passwords do not match.");
    return;
  }

  Store.changePassword(resetEmail, newPassword);

  // Clear everything and go back to the login form
  resetCode = "";
  forgotForm.reset();
  resetForm.reset();

  showTab("login");
  document.getElementById("loginEmail").value = resetEmail;
  document.getElementById("loginPassword").value = "";
  showSuccess("loginMessage", "Password changed. Please log in with your new password.");
});