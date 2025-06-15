// File: background.js
// Service Worker：Side Panel を開くボタンや自動起動の制御に使います
chrome.runtime.onInstalled.addListener(() => {
  console.log("domai extension installed");
});

// ページ切り替えボタン
document.getElementById("btn-memo").addEventListener("click", () => {
  window.location.href = "memo.html";
});
document.getElementById("btn-prompt").addEventListener("click", () => {
  window.location.href = "../prompt/prompt.html";
});
document.getElementById("btn-ai").addEventListener("click", () => {
  window.location.href = "../ai/ai.html";
});
document.getElementById("btn-setting").addEventListener("click", () => {
  window.location.href = "../setting/setting.html";
});
