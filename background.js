// File: background.js
// Service Worker：Side Panel を開くボタンや自動起動の制御に使います

chrome.runtime.onInstalled.addListener(() => {
  console.log("domai extension installed");
});
