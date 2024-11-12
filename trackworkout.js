// USER LOGIN TO VERIFY TO TRACK WORKOUT
window.onload = function () {
  const hash = window.location.hash;
  const accessToken = new URLSearchParams(hash.substring(1)).get(
    "access_token"
  );

  if (accessToken) {
    sessionStorage.setItem("spotifyAccessToken", accessToken);
    sessionStorage.setItem("loggedIn", "true");
    window.location.hash = "";
  } else {
    const isLoggedIn = sessionStorage.getItem("loggedIn");

    if (isLoggedIn !== "true") {
      window.location.href = "login.html";
    } else {
      console.log("User is already logged in!");
    }
  }
};

// TIMER CODE
const display = document.getElementById("timer");
let timer = null;
let startTime = 0;
let elaspedTime = 0;
let isRunning = false;

function start() {
  if (!isRunning) {
    startTime = Date.now() - elaspedTime;
    timer = setInterval(update, 10);
    isRunning = true;
  }
}

function stop() {
  if (isRunning) {
    clearInterval(timer);
    elaspedTime = Date.now() - startTime;
    isRunning = false;
  }
}

function reset() {
  clearInterval(timer);
  startTime = 0;
  elaspedTime = 0;
  isRunning = false;
  display.textContent = "00:00:00:00";
}

function update() {
  const current_time = Date.now();
  elaspedTime = current_time - startTime;

  let hours = Math.floor(elaspedTime / (1000 * 60 * 60));
  let minutes = Math.floor((elaspedTime / (1000 * 60)) % 60);
  let seconds = Math.floor((elaspedTime / 1000) % 60);
  let milliseconds = Math.floor((elaspedTime % 1000) / 10);

  hours = String(hours).padStart(2, "0");
  minutes = String(minutes).padStart(2, "0");
  seconds = String(seconds).padStart(2, "0");
  milliseconds = String(milliseconds).padStart(2, "0");

  display.textContent = `${hours}:${minutes}:${seconds}:${milliseconds}`;
}
