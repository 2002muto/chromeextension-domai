// edgeSensor.js  v3  (Left & Right sensors)
// -------------------------------------------------------------
// ① 画面左右端 4px 幅のセンサーを 2 本配置
// ② 300ms 滞在で background へ {type:"OPEN_PANEL", side:"left|right"} を送信
// -------------------------------------------------------------
(() => {
  console.log("[edgeSensor] injected");

  const SIDES = ["left", "right"]; // センサーを置く 2 方向
  const WIDTH = 4; // 4px 幅
  const DELAY = 300; // 300ms 滞在

  SIDES.forEach((side) => {
    const sensor = document.createElement("div");
    sensor.id = `domai-edge-sensor-${side}`;
    Object.assign(sensor.style, {
      position: "fixed",
      top: 0,
      [side]: 0, // left:0  または  right:0
      width: WIDTH + "px",
      height: "100vh",
      zIndex: 2147483647,
      pointerEvents: "auto",
    });
    document.documentElement.appendChild(sensor);

    let timer = null;
    sensor.addEventListener("mouseenter", () => {
      timer = setTimeout(() => {
        console.log(`[edgeSensor] ${side} hover ${DELAY}ms → open panel`);
        try {
          chrome.runtime.sendMessage({ type: "OPEN_PANEL", side });
        } catch (e) {
          if (e.message?.includes("context invalidated"))
            console.warn("[edgeSensor] context invalidated – safe to ignore");
          else console.error("[edgeSensor] sendMessage failed", e);
        }
      }, DELAY);
    });
    sensor.addEventListener("mouseleave", () => clearTimeout(timer));
  });
})();
