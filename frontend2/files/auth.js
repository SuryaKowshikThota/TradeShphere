Store.seedDemo();
if (Store.current()) window.location.href = "dashboard.html";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabs = document.querySelectorAll(".tab");

function showTab(name) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  loginForm.hidden = name !== "login";
  registerForm.hidden = name !== "register";
}
tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

function showError(id, text) { document.getElementById(id).textContent = text; }

loginForm.addEventListener("submit", e => {
  e.preventDefault();
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

registerForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  if (password.length < 6) return showError("registerMessage", "Password must be at least 6 characters.");
  if (Store.users()[email]) return showError("registerMessage", "An account with this email already exists. Log in instead.");
  Store.create(name, email, password);
  Store.login(email);
  window.location.href = "dashboard.html";
});

document.getElementById("fillDemo").addEventListener("click", () => {
  showTab("login");
  document.getElementById("loginEmail").value = DEMO.email;
  document.getElementById("loginPassword").value = DEMO.password;
});
