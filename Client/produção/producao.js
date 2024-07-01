import { setUserInfo, setMachineName } from "./scripts/userInfo.js";
import { render } from "./scripts/render.js";

function redirectToLogin() {
  window.location.href = "../login/login.html";
}

function handleLogout(event) {
  localStorage.clear();
  window.location.href = from === "home" ? "../home/home.html" : "../login/login.html";
}

function initializeUserInfo() {
  const username = localStorage.getItem("nome") || "UserName";
  const machineName = localStorage.getItem("maquina") || "MachineName";
  setUserInfo(username);
  setMachineName(machineName);
  render(machineName, username);
}

function updateTheme() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const isChecked = darkModeToggle.checked;
  document.body.classList.toggle("light-mode", !isChecked);
  document.body.classList.toggle("dark-mode", isChecked);
}

function addEventListeners() {
  document.getElementById("logoutLink").addEventListener("click", handleLogout);
  document.getElementById("darkModeToggle").addEventListener("change", updateTheme);
}

if (localStorage.getItem("isLoggedIn") !== "true") {
  redirectToLogin();
}

const urlParams = new URLSearchParams(window.location.search);
const from = urlParams.get("from");

initializeUserInfo();
updateTheme();
addEventListeners();
