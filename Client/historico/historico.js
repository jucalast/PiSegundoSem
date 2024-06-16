// main.js
import { DashboardController } from "./script/sections/dashboardControle.js";

$(document).ready(function () {
  const dashboardController = new DashboardController();

  $('aside .nav-link').click(function() {
    var section = $(this).text().toLowerCase();

    console.log('Clicked on ' + section);

    if (section === 'chapas') {
      dashboardController.initializeChapas();
    } else if (section === 'items') {
      dashboardController.initializeItems();
    } else if (section === 'máquinas') {
      // Initialize the Máquinas section
    } else if (section === 'usuários') {
      // Initialize the Usuários section
    }
  });

  // Initialize the Chapas section by default
  dashboardController.initializeChapas();
});

if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "../login/login.html";
}

logoutButton.addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "../login/login.html";
});

document.getElementById("user-name").textContent = localStorage.getItem("nome") || "UserName";
var name = localStorage.getItem("nome");
var profilePic = document.getElementById("profilePic");
profilePic.src = "https://api.dicebear.com/8.x/shapes/svg?seed=" + name;

profilePic.onerror = function () {
  this.onerror = null;
  this.src = "./media/pfpImg.jpg";
};

var darkModeToggle = document.getElementById("darkModeToggle");
var body = document.body;

// DARK MODE pode tirar se quiser
darkModeToggle.addEventListener("change", function () {
  if (darkModeToggle.checked) {
    body.classList.add("dark-mode");
    body.classList.remove("light-mode");
    localStorage.setItem("darkMode", "enabled");

    var aside = document.getElementById("aside");
    aside.classList.add("dark-mode-aside");
  } else {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    localStorage.setItem("darkMode", "disabled");

    var aside = document.getElementById("aside");
    aside.classList.remove("dark-mode-aside");
  }
});

if (localStorage.getItem("darkMode") === "enabled") {
  darkModeToggle.checked = true;
  body.classList.add("dark-mode");

  var aside = document.getElementById("aside");
  if (aside) {
    aside.classList.add("dark-mode-aside");
  }
} else {
  darkModeToggle.checked = false;
  body.classList.add("light-mode");

  var aside = document.getElementById("aside");
  if (aside) {
    aside.classList.remove("dark-mode-aside");
  }
}

function highlightCurrentPage() {
  var currentPage = window.location.pathname.split("/").pop();
  $("ul.list-unstyled li").removeClass("active");
  $("ul.list-unstyled li a[href='" + currentPage + "']")
    .parent()
    .addClass("active");
}

$(document).ready(function () {
  highlightCurrentPage();
});
