/****************************************************************************************
 * Background v4 – 右端ホバーごとに「そのウィンドウ右端」に拡張ポップアップを表示
 *  - sidePanel API は使用せず常に popup で統一
 *  - 各ウィンドウにつき同時に 1 つだけ開く
 *  - 閉じられたら自動で再度開けるよう管理配列から削除
 ****************************************************************************************/

/* 右端センサー (edgeSensor.js) から届くメッセージ名 */
const MSG_OPEN = "OPEN_PANEL";

/* 開いた popup windowId を windowId キーで保持 */
const popupMap = new Map(); // key: baseWindowId, value: popupWindowId

/*────────────────── 受信 ─────────────────*/
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== MSG_OPEN) return;

  /* 送信元タブの所属ウィンドウを特定 */
  chrome.windows.get(sender.tab.windowId, { populate: false }, (baseWin) => {
    if (!baseWin) return;

    /* 既にそのウィンドウ用 popup があれば focus して終了 */
    const existing = popupMap.get(baseWin.id);
    if (existing) {
      chrome.windows.update(existing, { focused: true });
      return;
    }

    /* 新規 popup を作成 */
    const W = 420; // 幅
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("pages/prompt/prompt.html"),
        type: "popup",
        width: W,
        height: baseWin.height,
        top: baseWin.top,
        left: baseWin.left + baseWin.width - W,
        focused: true,
      },
      (pop) => {
        popupMap.set(baseWin.id, pop.id);
        console.log(`[BG] popup opened for Win${baseWin.id} → Popup${pop.id}`);

        /* popup が閉じられたら管理表から削除 */
        chrome.windows.onRemoved.addListener(function handler(closedId) {
          if (closedId === pop.id) {
            popupMap.delete(baseWin.id);
            chrome.windows.onRemoved.removeListener(handler);
          }
        });
      }
    );
  });
});
