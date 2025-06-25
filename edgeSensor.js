// edgeSensor.js
// -------------------------------------------------------------
// ページ右端 4px 幅のセンサー領域を生成し、マウスが 300ms 滞在すると
// background.js へ {type:"OPEN_PANEL"} を送信して sidePanel を表示。
// -------------------------------------------------------------
(() => {
  console.log("[edgeSensor] injected");

  /* 1. センサー DIV を注入 */
  const sensor = document.createElement("div");
  sensor.id = "domai-edge-sensor";
  Object.assign(sensor.style, {
    position: "fixed",
    top: 0,
    right: 0,
    width: "4px",
    height: "100vh",
    zIndex: 2147483647, // 最前面
    pointerEvents: "auto",
  });
  document.documentElement.appendChild(sensor);

  /* 2. ホバー検知 */
  let timer = null;
  sensor.addEventListener("mouseenter", () => {
    console.log("[edgeSensor] mouseenter");
    timer = setTimeout(() => {
      console.log("[edgeSensor] hover 300ms → open panel");
      chrome.runtime.sendMessage({ type: "OPEN_PANEL" });
    }, 100);
  });
  sensor.addEventListener("mouseleave", () => {
    console.log("[edgeSensor] mouseleave");
    clearTimeout(timer);
  });
})();
