// File: pages/utils.js
"use strict";

/* ━━━━━━━━━━ Chrome Storage API Wrapper ━━━━━━━━━━ */
window.AppUtils = window.AppUtils || {};

// Promise-wrapped Chrome Storage API
window.AppUtils.loadStorage = function (key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => resolve(res[key] || []));
  });
};

window.AppUtils.saveStorage = function (key, arr) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: arr }, () => resolve());
  });
};

/* ━━━━━━━━━━ 汎用保存確認ダイアログ ━━━━━━━━━━ */
window.AppUtils.showSaveConfirmDialog = function (options = {}) {
  const {
    title = "変更を保存しますか？",
    message = "編集内容に変更があります。<br>保存せずに戻ると変更が失われます。",
    onSave,
    onDiscard,
    onCancel,
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".save-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "save-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-exclamation-circle dialog-icon"></i>
          <h3 class="dialog-title">${title}</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${message}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn discard-btn">破棄</button>
          <button class="dialog-btn cancel-btn">キャンセル</button>
          <button class="dialog-btn save-btn">保存</button>
        </div>
      </div>
    </div>
  `;

  // スタイルを動的に追加
  if (!document.querySelector("#save-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "save-confirm-styles";
    styles.textContent = `
      .save-confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .save-confirm-dialog .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .save-confirm-dialog .dialog-content {
        position: relative;
        background: #2d2d2d;
        border-radius: 12px;
        min-width: 280px;
        max-width: calc(100vw - 40px);
        width: 90%;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .save-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .save-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #3b82f6;
      }

      .save-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .save-confirm-dialog .dialog-body {
        padding: 16px 20px;
      }

      .save-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .save-confirm-dialog .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .save-confirm-dialog .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }

      .save-confirm-dialog .discard-btn {
        background: #dc3545;
        color: #ffffff;
      }

      .save-confirm-dialog .discard-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .save-confirm-dialog .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .save-btn {
        background: #00a31e;
        color: #ffffff;
      }

      .save-confirm-dialog .save-btn:hover {
        background: #008a1a;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .save-confirm-dialog .dialog-overlay.closing {
        animation: fadeOut 0.2s ease-in forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes slideDown {
        to {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }
      }

      @keyframes fadeOut {
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // イベントリスナー設定
  const overlay = dialog.querySelector(".dialog-overlay");
  const content = dialog.querySelector(".dialog-content");
  const discardBtn = dialog.querySelector(".discard-btn");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const saveBtn = dialog.querySelector(".save-btn");

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 200);
  }

  // 破棄ボタン
  discardBtn.addEventListener("click", () => {
    closeDialog();
    if (onDiscard) onDiscard();
  });

  // キャンセルボタン
  cancelBtn.addEventListener("click", () => {
    closeDialog();
    if (onCancel) onCancel();
  });

  // 保存ボタン
  saveBtn.addEventListener("click", () => {
    closeDialog();
    if (onSave) onSave();
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // ESCキーで閉じる
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDialog();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理
  setTimeout(() => {
    saveBtn.focus();
  }, 100);
};

/* ━━━━━━━━━━ 汎用削除確認ダイアログ ━━━━━━━━━━ */
window.AppUtils.showDeleteConfirmDialog = function (options = {}) {
  const {
    title = "削除しますか？",
    message = "この操作は元に戻すことができません。",
    onConfirm,
    onCancel,
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".delete-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "delete-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-exclamation-triangle dialog-icon"></i>
          <h3 class="dialog-title">${title}</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${message}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn">キャンセル</button>
          <button class="dialog-btn delete-btn">削除</button>
        </div>
      </div>
    </div>
  `;

  // スタイルを動的に追加
  if (!document.querySelector("#delete-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "delete-confirm-styles";
    styles.textContent = `
      .delete-confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .delete-confirm-dialog .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .delete-confirm-dialog .dialog-content {
        position: relative;
        background: #2d2d2d;
        border-radius: 12px;
        min-width: 280px;
        max-width: calc(100vw - 40px);
        width: 90%;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .delete-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .delete-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #f59e0b;
      }

      .delete-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .delete-confirm-dialog .dialog-body {
        padding: 16px 20px;
      }

      .delete-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .delete-confirm-dialog .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .delete-confirm-dialog .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }

      .delete-confirm-dialog .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .delete-confirm-dialog .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .delete-confirm-dialog .delete-btn {
        background: #dc3545;
        color: #ffffff;
      }

      .delete-confirm-dialog .delete-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
      }

      .delete-confirm-dialog .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .delete-confirm-dialog .dialog-overlay.closing {
        animation: fadeOut 0.2s ease-in forwards;
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // イベントリスナー設定
  const overlay = dialog.querySelector(".dialog-overlay");
  const content = dialog.querySelector(".dialog-content");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const deleteBtn = dialog.querySelector(".delete-btn");

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 200);
  }

  // キャンセルボタン
  cancelBtn.addEventListener("click", () => {
    closeDialog();
    if (onCancel) onCancel();
  });

  // 削除ボタン
  deleteBtn.addEventListener("click", () => {
    closeDialog();
    if (onConfirm) onConfirm();
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // ESCキーで閉じる
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDialog();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理
  setTimeout(() => {
    cancelBtn.focus();
  }, 100);
};

/* ━━━━━━━━━━ 汎用確認ダイアログ ━━━━━━━━━━ */
window.AppUtils.showConfirmDialog = function (options = {}) {
  const {
    title = "確認",
    message = "この操作を実行しますか？",
    onConfirm,
    onCancel,
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-question-circle dialog-icon"></i>
          <h3 class="dialog-title">${title}</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${message}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn">キャンセル</button>
          <button class="dialog-btn confirm-btn">確認</button>
        </div>
      </div>
    </div>
  `;

  // スタイルを動的に追加
  if (!document.querySelector("#confirm-dialog-styles")) {
    const styles = document.createElement("style");
    styles.id = "confirm-dialog-styles";
    styles.textContent = `
      .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .confirm-dialog .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .confirm-dialog .dialog-content {
        position: relative;
        background: #2d2d2d;
        border-radius: 12px;
        min-width: 280px;
        max-width: calc(100vw - 40px);
        width: 90%;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #3b82f6;
      }

      .confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .confirm-dialog .dialog-body {
        padding: 16px 20px;
      }

      .confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      .confirm-dialog .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .confirm-dialog .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }

      .confirm-dialog .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .confirm-dialog .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .confirm-dialog .confirm-btn {
        background: #3b82f6;
        color: #ffffff;
      }

      .confirm-dialog .confirm-btn:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }

      .confirm-dialog .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .confirm-dialog .dialog-overlay.closing {
        animation: fadeOut 0.2s ease-in forwards;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes slideDown {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // DOMに追加
  document.body.appendChild(dialog);

  // 要素取得
  const overlay = dialog.querySelector(".dialog-overlay");
  const content = dialog.querySelector(".dialog-content");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const confirmBtn = dialog.querySelector(".confirm-btn");

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 200);
  }

  // キャンセルボタン
  cancelBtn.addEventListener("click", () => {
    closeDialog();
    if (onCancel) onCancel();
  });

  // 確認ボタン
  confirmBtn.addEventListener("click", () => {
    closeDialog();
    if (onConfirm) onConfirm();
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // ESCキーで閉じる
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDialog();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理
  setTimeout(() => {
    confirmBtn.focus();
  }, 100);
};

/* ━━━━━━━━━━ アーカイブアニメーション機能 ━━━━━━━━━━ */
window.AppUtils.animateArchiveItem = async function (element, onComplete) {
  return new Promise((resolve) => {
    // ランダムに3つの方向から選択（33%ずつの確率）
    const random = Math.random();
    let animationType, animationClass;

    if (random < 0.33) {
      animationType = "left";
      animationClass = "archiving-left";
    } else if (random < 0.66) {
      animationType = "right";
      animationClass = "archiving-right";
    } else {
      animationType = "down";
      animationClass = "archiving-down";
    }

    console.log(
      `[ARCHIVE] ${
        animationType === "left"
          ? "左"
          : animationType === "right"
          ? "右"
          : "下"
      }にアニメーション`
    );

    // アニメーション開始前にアーカイブアイコンを光らせる
    // CLIPBOARDページではアイコンが<button>内にあるため、.clipboard-archive iも対象
    const archiveIcon = element.querySelector(
      ".actions, .prompt-archive, .clipboard-archive i"
    );
    if (archiveIcon) {
      console.log("[AppUtils] Highlight archive icon", archiveIcon);
      archiveIcon.style.color = "#f59e0b";
      archiveIcon.style.transform = "scale(1.2)";
      archiveIcon.style.transition = "all 0.2s ease";
    } else {
      console.warn("[AppUtils] Archive icon not found for highlight");
    }

    // 既存のアニメーションクラスを削除（もしあれば）
    element.classList.remove(
      "archiving-left",
      "archiving-right",
      "archiving-down"
    );

    // 強制的にリフローを発生させてクラス削除を確定
    void element.offsetWidth;

    // 選択されたアニメーションクラスを追加
    element.classList.add(animationClass);

    // アニメーション用スタイルを動的に追加（初回のみ）
    if (!document.querySelector("#archive-animation-styles")) {
      const styles = document.createElement("style");
      styles.id = "archive-animation-styles";
      styles.textContent = `
        .archiving-left {
          animation: archiveSlideOutLeft 0.6s ease-in-out forwards;
          pointer-events: none; /* クリック無効化 */
        }

        .archiving-right {
          animation: archiveSlideOutRight 0.6s ease-in-out forwards;
          pointer-events: none; /* クリック無効化 */
        }

        .archiving-down {
          animation: archiveFallDown 0.8s ease-in forwards;
          pointer-events: none; /* クリック無効化 */
        }

        @keyframes archiveSlideOutLeft {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          30% {
            opacity: 0.8;
            transform: translateX(-10px) scale(0.98);
          }
          60% {
            opacity: 0.4;
            transform: translateX(-30px) scale(0.95) rotateZ(-2deg);
          }
          100% {
            opacity: 0;
            transform: translateX(-100px) scale(0.8) rotateZ(-5deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        @keyframes archiveSlideOutRight {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          30% {
            opacity: 0.8;
            transform: translateX(10px) scale(0.98);
          }
          60% {
            opacity: 0.4;
            transform: translateX(30px) scale(0.95) rotateZ(2deg);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) scale(0.8) rotateZ(5deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        @keyframes archiveFallDown {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateZ(0deg);
          }
          20% {
            opacity: 0.9;
            transform: translateY(10px) scale(0.98) rotateZ(2deg);
          }
          40% {
            opacity: 0.7;
            transform: translateY(30px) scale(0.95) rotateZ(-3deg);
          }
          60% {
            opacity: 0.5;
            transform: translateY(60px) scale(0.9) rotateZ(5deg);
          }
          80% {
            opacity: 0.2;
            transform: translateY(100px) scale(0.8) rotateZ(-8deg);
          }
          100% {
            opacity: 0;
            transform: translateY(150px) scale(0.6) rotateZ(15deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        /* アーカイブ成功トースト */
        .archive-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          animation: toastSlideIn 0.3s ease-out;
        }

        .archive-toast.fade-out {
          animation: toastFadeOut 0.3s ease-in forwards;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toastFadeOut {
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // animationend イベントリスナーを使用してより確実にアニメーション完了を検知
    const handleAnimationEnd = async (event) => {
      // 3つのアニメーション完了を対象にする
      if (
        event.animationName === "archiveSlideOutLeft" ||
        event.animationName === "archiveSlideOutRight" ||
        event.animationName === "archiveFallDown"
      ) {
        element.removeEventListener("animationend", handleAnimationEnd);

        // データ更新処理を実行
        await onComplete();

        // トースト通知を表示
        window.AppUtils.showArchiveToast();

        // 要素を完全に削除
        element.remove();

        // 他のアイテムの位置を調整するためのアニメーション
        const remainingItems = document.querySelectorAll(
          ".memo-item, .clipboard-item, .prompt-item"
        );
        remainingItems.forEach((item, index) => {
          // 既存のアニメーションとトランジションを完全にクリア
          item.style.animation = "";
          item.style.transition = "";
          item.style.transform = "";
          item.style.opacity = "";

          // 強制的にリフローを発生させて状態をリセット
          void item.offsetHeight;

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.style.animation = `slideUp 0.3s ease-out both`;

            // アニメーション完了後にスタイルをクリーンアップ
            setTimeout(() => {
              item.style.animation = "";
              item.style.transform = "";
              item.style.opacity = "";
            }, 300); // slideUpアニメーションの時間(0.3s)と同期
          }, index * 50);
        });

        // slideUpアニメーションを動的に追加
        if (!document.querySelector("#slide-up-animation")) {
          const slideUpStyles = document.createElement("style");
          slideUpStyles.id = "slide-up-animation";
          slideUpStyles.textContent = `
            @keyframes slideUp {
              from {
                transform: translateY(10px);
                opacity: 0.8;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `;
          document.head.appendChild(slideUpStyles);
        }

        resolve();
      }
    };

    // アニメーション完了イベントを監視
    element.addEventListener("animationend", handleAnimationEnd);

    // フォールバック: 1000ms後に強制的に完了処理を実行（下落ちアニメーションが長いため）
    setTimeout(async () => {
      if (element.parentNode) {
        // まだ要素が存在する場合
        element.removeEventListener("animationend", handleAnimationEnd);
        console.warn("[ARCHIVE] Animation timeout - forcing completion");

        await onComplete();
        window.AppUtils.showArchiveToast();
        element.remove();

        const remainingItems = document.querySelectorAll(
          ".memo-item, .clipboard-item, .prompt-item"
        );
        remainingItems.forEach((item, index) => {
          // 既存のアニメーションとトランジションを完全にクリア
          item.style.animation = "";
          item.style.transition = "";
          item.style.transform = "";
          item.style.opacity = "";

          // 強制的にリフローを発生させて状態をリセット
          void item.offsetHeight;

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.style.animation = `slideUp 0.3s ease-out both`;

            // アニメーション完了後にスタイルをクリーンアップ
            setTimeout(() => {
              item.style.animation = "";
              item.style.transform = "";
              item.style.opacity = "";
            }, 300); // slideUpアニメーションの時間(0.3s)と同期
          }, index * 50);
        });

        resolve();
      }
    }, 1000); // 800ms → 1000ms に延長
  });
};

/* ━━━━━━━━━━ トースト通知機能 ━━━━━━━━━━ */
window.AppUtils.showArchiveToast = function () {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".archive-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // 新しいトーストを作成
  const toast = document.createElement("div");
  toast.className = "archive-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    アーカイブに移動しました
  `;

  // bodyに追加
  document.body.appendChild(toast);

  // 2秒後にフェードアウト
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
};

/* ━━━━━━━━━━ 復元アニメーション機能 ━━━━━━━━━━ */
// アーカイブアニメーション
async function animateArchiveItem(item, callback) {
  return new Promise((resolve) => {
    // アニメーション開始
    item.style.transition = "all 0.5s ease-in-out";
    item.style.transform = "translateY(-20px) scale(0.95)";
    item.style.opacity = "0";

    setTimeout(async () => {
      // コールバック実行（データ更新）
      await callback();

      // アニメーション完了
      setTimeout(() => {
        resolve();
      }, 100);
    }, 500);
  });
}

// 復元アニメーション（上にアニメーションして消える）
async function animateRestoreItem(item, callback) {
  return new Promise((resolve) => {
    // アニメーション開始
    item.style.transition = "all 0.5s ease-in-out";
    item.style.transform = "translateY(-50px) scale(0.9)";
    item.style.opacity = "0";
    item.style.filter = "blur(2px)";

    setTimeout(async () => {
      // コールバック実行（データ更新）
      await callback();

      // アニメーション完了
      setTimeout(() => {
        resolve();
      }, 100);
    }, 500);
  });
}

console.log("[UTILS] AppUtils loaded successfully");

// グローバルに公開
window.AppUtils = {
  showConfirmDialog,
  showSaveConfirmDialog,
  showToast,
  animateArchiveItem,
  animateRestoreItem,
};

/* ━━━━━━━━━━ 共通トースト通知機能 ━━━━━━━━━━ */
window.AppUtils.showToast = function (message, type = "info") {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".common-toast-message");
  if (existingToast) {
    existingToast.remove();
  }

  // アイコンと色をtypeで切り替え
  let icon = "";
  let borderColor = "#3b82f6"; // info: 青
  let bgColor = "rgba(59, 130, 246, 0.1)";
  let iconColor = "#3b82f6";
  if (type === "success") {
    icon = '<i class="bi bi-check-circle"></i>';
    borderColor = "#10b981";
    bgColor = "rgba(16, 185, 129, 0.1)";
    iconColor = "#10b981";
  } else if (type === "error") {
    icon = '<i class="bi bi-exclamation-triangle"></i>';
    borderColor = "#ef4444";
    bgColor = "rgba(239, 68, 68, 0.1)";
    iconColor = "#ef4444";
  } else if (type === "info") {
    icon = '<i class="bi bi-info-circle"></i>';
    borderColor = "#3b82f6";
    bgColor = "rgba(59, 130, 246, 0.1)";
    iconColor = "#3b82f6";
  } else if (type === "warn" || type === "warning") {
    icon = '<i class="bi bi-exclamation-circle"></i>';
    borderColor = "#f59e0b";
    bgColor = "rgba(245, 158, 11, 0.1)";
    iconColor = "#f59e0b";
  }

  // トーストHTML
  const toast = document.createElement("div");
  toast.className = "common-toast-message";
  toast.innerHTML = `
    <span class="toast-icon" style="color: ${iconColor}">${icon}</span>
    <span class="toast-text">${message}</span>
  `;

  // スタイルを動的に追加（初回のみ）
  if (!document.querySelector("#common-toast-styles")) {
    const styles = document.createElement("style");
    styles.id = "common-toast-styles";
    styles.textContent = `
      .common-toast-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        border-left: 4px solid ${borderColor};
        color: #ffffff;
        padding: 14px 22px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1rem;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
        max-width: 340px;
        min-width: 180px;
        word-break: break-all;
      }
      .common-toast-message.show {
        opacity: 1;
        transform: translateX(0);
      }
      .common-toast-message .toast-icon {
        font-size: 1.3rem;
        flex-shrink: 0;
      }
      .common-toast-message .toast-text {
        flex: 1;
        color: #fff;
        word-break: break-word;
      }
    `;
    document.head.appendChild(styles);
  }

  // bodyに追加
  document.body.appendChild(toast);
  // アニメーションで表示
  setTimeout(() => {
    toast.classList.add("show");
  }, 50);
  // 2秒後にフェードアウト
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
};
