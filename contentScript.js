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
