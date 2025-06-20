// contentScript.js
(() => {
  console.log("[CS] loaded");

  let lastEl = null;
  const TARGETS =
    "textarea," +
    'input[type="text"],input[type="search"],input[type="email"],input[type="url"],input[type="tel"],' +
    '[contenteditable="true"],' +
    '[role="textbox"]'; // ← 追加

  // 最後にフォーカスされた要素をキャッシュ
  document.addEventListener("focusin", (e) => {
    if (e.target.matches(TARGETS)) {
      lastEl = e.target;
      console.log("[CS] cache element:", lastEl);
    }
  });

  // popup からのメッセージでテキストを挿入
  chrome.runtime.onMessage.addListener((req) => {
    if (req.type !== "INSERT_CLIP" || !lastEl) return;

    // textarea / input
    if ("value" in lastEl) {
      const { selectionStart: s, selectionEnd: e, value: v } = lastEl;
      lastEl.value = v.slice(0, s) + req.text + v.slice(e);
      lastEl.selectionStart = lastEl.selectionEnd = s + req.text.length;
    } else {
      // contenteditable かつ role="textbox" の場合
      lastEl.focus();
      document.execCommand("insertText", false, req.text);
    }
    console.log("[CS] inserted:", req.text);
  });
})();
