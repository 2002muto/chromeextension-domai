// File: pages/timer/timer.js
(function () {
  "use strict";

  const timerDisplay = document.createElement("div");
  timerDisplay.id = "timer-display";
  timerDisplay.textContent = "00:00:00";

  const startButton = document.createElement("button");
  startButton.className = "btn btn-success";
  startButton.textContent = "Start";

  const stopButton = document.createElement("button");
  stopButton.className = "btn btn-danger";
  stopButton.textContent = "Stop";

  const resetButton = document.createElement("button");
  resetButton.className = "btn btn-warning";
  resetButton.textContent = "Reset";

  const controls = document.createElement("div");
  controls.className = "timer-controls";
  controls.append(startButton, stopButton, resetButton);

  const timerContent = document.querySelector(".timer-content");
  timerContent.append(timerDisplay, controls);

  let timer;
  let seconds = 0;

  const updateDisplay = () => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    timerDisplay.textContent = `${h}:${m}:${s}`;
  };

  const startTimer = () => {
    if (!timer) {
      timer = setInterval(() => {
        seconds++;
        updateDisplay();
      }, 1000);
    }
  };

  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };

  const resetTimer = () => {
    stopTimer();
    seconds = 0;
    updateDisplay();
  };

  startButton.addEventListener("click", startTimer);
  stopButton.addEventListener("click", stopTimer);
  resetButton.addEventListener("click", resetTimer);
})();