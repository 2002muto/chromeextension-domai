/****************************************************************************************
 * BG v8 – FOCUS_TAB / GET_LAST_PAGE_TAB / SIDE_PANEL_CONTROL
 ****************************************************************************************/
const WIDTH = 420;
const popups = new Map(); // baseWin.id → popup.id
let lastTab = null; // 直近入力フォーカスのページタブ

// ───────────────────────────────────────
// 追加: iframe用ヘッダー解除ルール設定
// ───────────────────────────────────────
const BYPASS_RULE_ID = 100;

function setupBypassHeadersRule() {
  const extensionDomain = chrome.runtime.id;
  const rule = {
    id: BYPASS_RULE_ID,
    priority: 1,
    action: {
      type: "modifyHeaders",
      responseHeaders: [
        { header: "x-frame-options", operation: "remove" },
        { header: "content-security-policy", operation: "remove" },
      ],
    },
    condition: {
      resourceTypes: ["sub_frame"],
      initiatorDomains: [extensionDomain],
      tabIds: [-1],
    },
  };

  chrome.declarativeNetRequest
    .updateDynamicRules({ removeRuleIds: [BYPASS_RULE_ID], addRules: [rule] })
    .then(() => {
      console.log("[BG] Bypass header rule added");
    })
    .catch((err) => {
      console.error("[BG] Failed to add bypass rule", err);
    });
}

setupBypassHeadersRule();

// 0) 拡張機能アイコンクリック時のサイドパネル制御
chrome.action.onClicked.addListener(async (tab) => {
  console.log(`[BG] Extension icon clicked on tab ${tab.id}`);
  try {
    // サイドパネルを開く
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log(`[BG] Side panel opened for tab ${tab.id}`);
  } catch (error) {
    console.error("[BG] Failed to open side panel:", error);
  }
});

// 1) タブ切り替え（アクティブタブ変更）を監視
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  console.log(`[BG] onActivated → window ${windowId}, tab ${tabId}`);
  lastTab = tabId;
});

// 2) 既存の FOCUS_TAB／GET_LAST_PAGE_TAB 処理
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  if (msg.type === "FOCUS_TAB" && sender.tab?.id) {
    console.log(`[BG] FOCUS_TAB received from tab ${sender.tab.id}`);
    lastTab = sender.tab.id;
    return;
  }

  if (msg.type === "GET_LAST_PAGE_TAB") {
    console.log(`[BG] GET_LAST_PAGE_TAB → returning tab ${lastTab}`);
    sendRes({ tabId: lastTab });
    return true; // 非同期レスポンスを許可
  }

  /* edgeSensor → パネル要求 */
  if (msg.type !== "OPEN_PANEL") return;

  // chrome.windows.get(sender.tab.windowId, {}, (w) => {
  //   if (!w) return;

  //   /* すでに popup を開いていれば再利用 */
  //   const existing = popups.get(w.id);
  //   if (existing) {
  //     chrome.windows.update(existing, { focused: true });
  //     return;
  //   }

  //   /* popup 生成 */
  //   const leftPos = msg.side === "left" ? w.left : w.left + w.width - WIDTH;
  //   chrome.windows.create(
  //     {
  //       url: chrome.runtime.getURL("pages/prompt/prompt.html"),
  //       type: "popup",
  //       width: WIDTH,
  //       height: w.height,
  //       top: w.top,
  //       left: leftPos,
  //       focused: true,
  //     },
  //     (p) => {
  //       popups.set(w.id, p.id);
  //       chrome.windows.onRemoved.addListener(function cleanup(id) {
  //         if (id === p.id) {
  //           popups.delete(w.id);
  //           chrome.windows.onRemoved.removeListener(cleanup);
  //         }
  //       });
  //     }
  //   );
  // });
});
