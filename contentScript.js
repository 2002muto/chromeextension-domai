// contentScript.js  （※先頭行にファイル名を書くルールに合わせています）

console.log("[CS] loaded");
window._lastReq = null;
// ───────── 1. 判定ヘルパ ─────────
function isEditableTarget(node) {
  if (!node || !node.tagName) return false;
  const tag = node.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (
    tag === "input" &&
    /^(text|search|email|url|number|tel|password)$/i.test(node.type)
  )
    return true;
  if (node.isContentEditable) return true;
  return false;
}

// ───────── 2. FOCUS_TAB 送信（既存）─────────
const sendFocus = (() => {
  // 50 ms デバウンス
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last < 50) return;
    last = now;
    chrome.runtime.sendMessage({ type: "FOCUS_TAB" }).catch(() => {});
  };
})();
["focusin", "pointerdown"].forEach((ev) =>
  document.addEventListener(
    ev,
    (e) => {
      if (isEditableTarget(e.target)) sendFocus();
    },
    true
  )
);
window.addEventListener("focus", sendFocus);

// ───────── 3. INSERT_CLIP で選択置換 ─────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "INSERT_CLIP") return;
  if (msg.requestId && window._lastReq === msg.requestId) return;
  window._lastReq = msg.requestId;
  if (window !== window.top) return; // サブフレーム無視

  const text = msg.text || "";
  const el = document.activeElement;
  if (!isEditableTarget(el)) return;

  /* textarea / input ---------------------------------------------------- */
  if (
    el.tagName.toLowerCase() === "textarea" ||
    el.tagName.toLowerCase() === "input"
  ) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;

    // 選択範囲を text で置換
    el.value = el.value.slice(0, start) + text + el.value.slice(end);

    // caret を挿入文字の末尾へ
    const caretPos = start + text.length;
    el.setSelectionRange(caretPos, caretPos);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  /* contenteditable ----------------------------------------------------- */
  if (el.isContentEditable) {
    const sel = document.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      // テキストノードを挿入
      range.insertNode(document.createTextNode(text));
      // caret を末尾へ
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // フォーカスはあるが選択なし → 末尾へ追加
      el.textContent += text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
});

// ───────── 4. タイマーポップアップ通知 ─────────
// ポップアップ通知のHTMLを作成
function createTimerPopup() {
  // スタイル定義
  const styles = `
    #timerPopupNotification {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transform: translate(-50%, -50%);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #2d2d2d, #3a3a3a);
      border-radius: 16px;
      padding: 0;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      color: white;
      opacity: 0;
      transform: translate(-50%, -40%) scale(0.95);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #timerPopupNotification.visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    #timerPopupNotification .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    #timerPopupNotification .title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    #timerPopupNotification .close-btn {
      background: none;
      border: none;
      color: #b0b0b0;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    #timerPopupNotification .body {
      padding: 24px;
    }
    #timerPopupNotification .message {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
    #timerPopupNotification .footer {
      padding: 20px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: right;
    }
    #timerPopupNotification .ok-btn {
      background: linear-gradient(135deg, #e95404, #a600cf);
      border: none;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
  `;

  // style要素を作成して追加
  const styleSheet = document.createElement("style");
  styleSheet.id = "timerPopupStyles";
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // HTML構造
  const popup = document.createElement("div");
  popup.id = "timerPopupNotification";
  popup.innerHTML = `
    <div class="header">
      <h3 id="timerPopupTitle" class="title"></h3>
      <button id="timerPopupCloseBtn" class="close-btn">✕</button>
    </div>
    <div class="body">
      <p id="timerPopupMessage" class="message"></p>
    </div>
    <div class="footer">
      <button id="timerPopupOkBtn" class="ok-btn">OK</button>
    </div>
  `;

  // イベントリスナー
  popup.querySelector("#timerPopupCloseBtn").onclick = () => removeTimerPopup();
  popup.querySelector("#timerPopupOkBtn").onclick = () => removeTimerPopup();

  return popup;
}

// ポップアップ通知を表示
function showTimerPopup(title, message) {
  removeTimerPopup(); // 既存のポップアップを削除

  const popup = createTimerPopup();
  document.body.appendChild(popup);

  popup.querySelector("#timerPopupTitle").textContent = title;
  popup.querySelector("#timerPopupMessage").textContent = message;

  // 表示アニメーション
  requestAnimationFrame(() => {
    popup.classList.add("visible");
  });

  // 5秒後に自動で閉じる
  setTimeout(() => {
    removeTimerPopup();
  }, 5000);
}

// ポップアップ通知を削除
function removeTimerPopup() {
  const popup = document.getElementById("timerPopupNotification");
  if (popup) {
    popup.classList.remove("visible");
    // アニメーション後に要素を削除
    setTimeout(() => {
      popup.remove();
      const styleSheet = document.getElementById("timerPopupStyles");
      if (styleSheet) {
        styleSheet.remove();
      }
    }, 300);
  }
}

// タイマー通知メッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SHOW_TIMER_POPUP") {
    console.log("[CS] タイマーポップアップ通知を受信:", request);
    showTimerPopup(request.title, request.message);
    sendResponse({ success: true });
    return true;
  }
});
