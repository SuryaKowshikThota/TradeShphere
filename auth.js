Store.seedDemo();

if (Store.current()) {
  window.location.href = "dashboard.html";
}

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabs = document.querySelectorAll(".form-tab");

function showTab(name) {
  tabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.tab === name);
  });

  loginForm.hidden = name !== "login";
  registerForm.hidden = name !== "register";
}

function showError(id, text) {
  document.getElementById(id).textContent = text;
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    showTab(tab.dataset.tab);
  });
});

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();

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

  const email = document.getElementById("registerEmail").value.trim().toLowerCase();

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