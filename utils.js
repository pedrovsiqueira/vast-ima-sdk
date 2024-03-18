export function isValidUrl(string) {
  const urlPattern = /^(http|https):\/\/[^\s]+?\.[^\s]+$/;
  return urlPattern.test(string);
}

export function logToScreen(message) {
  const logMessagesElement = document.getElementById("logMessages");
  logMessagesElement.innerHTML += message + "<br>";
}

export function clearLogMessages() {
  document.getElementById("logMessages").innerHTML = "";
}
