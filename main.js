import { loadAd, setUpIMA, addSampleVastTag } from "./adSetup.js";
import { clearLogMessages } from "./utils.js";

function bindEventListeners() {
  document
    .getElementById("clearLogButton")
    .addEventListener("click", clearLogMessages);
  document
    .getElementById("sampleVastTagLink")
    .addEventListener("click", (event) => {
      event.preventDefault();
      addSampleVastTag();
    });

  document.getElementById("loadAdButton").addEventListener("click", loadAd);
}

function init() {
  try {
    setUpIMA();
    bindEventListeners();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

document.addEventListener("DOMContentLoaded", init);
