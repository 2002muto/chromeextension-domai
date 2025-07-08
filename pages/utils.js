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
    discardLabel = "破棄",
    cancelLabel = "キャンセル",
    saveLabel = "保存",
    discardColor = "#dc3545",
    cancelColor = "#4a5568",
    saveColor = "#00a31e",
    iconClass = "bi bi-exclamation-circle",
    showSave = true,
    showDiscard = true,
    showCancel = true,
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".save-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成 - 図に基づいた階層構造
  const dialog = document.createElement("div");
  dialog.className = "save-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-icon-wrapper">
            <i class="${iconClass} dialog-icon"></i>
          </div>
          <div class="dialog-title-wrapper">
          <h3 class="dialog-title">${title}</h3>
          </div>
        </div>
        <div class="dialog-body">
          <div class="dialog-message-wrapper">
          <p class="dialog-message">${message}</p>
          </div>
        </div>
        <div class="dialog-footer">
          <div class="dialog-buttons-wrapper">
            ${
              showDiscard
                ? `<button class="dialog-btn discard-btn" data-action="discard">
                     <i class="bi bi-trash3"></i>
                     <span>${discardLabel}</span>
                   </button>`
                : ""
            }
            ${
              showCancel
                ? `<button class="dialog-btn cancel-btn" data-action="cancel">
                     <i class="bi bi-x-circle"></i>
                     <span>${cancelLabel}</span>
                   </button>`
                : ""
            }
            ${
              showSave
                ? `<button class="dialog-btn save-btn" data-action="save">
                     <i class="bi bi-check-circle"></i>
                     <span>${saveLabel}</span>
                   </button>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // 改善されたスタイル - 図に基づいた階層構造とモダンデザイン
  if (!document.querySelector("#save-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "save-confirm-styles";
    styles.textContent = `
      /* ダイアログオーバーレイ - 最上位層 */
      .save-confirm-dialog {
        position: fixed !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        box-sizing: border-box !important;
      }
      
      /* ダイアログオーバーレイ背景 */
      .save-confirm-dialog .dialog-overlay {
        position: absolute !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.75) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        animation: dialogFadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 999998 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* ダイアログコンテンツ - メインコンテナ */
      .save-confirm-dialog .dialog-content {
        position: relative !important;
        background: linear-gradient(135deg, #2a2f3a 0%, #23272f 100%);
        border-radius: 20px;
        min-width: 340px;
        max-width: 90vw;
        width: 100%;
        max-width: 420px;
        margin: 20px auto !important;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.6),
          0 8px 32px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 999999 !important;
        transform: translate(0, 0) !important;
      }
      
      /* ダイアログヘッダー */
      .save-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 28px 28px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
      }
      
      .save-confirm-dialog .dialog-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        flex-shrink: 0;
      }

      .save-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #ffffff;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .save-confirm-dialog .dialog-title-wrapper {
        flex: 1;
        min-width: 0;
      }

      .save-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      /* ダイアログボディ */
      .save-confirm-dialog .dialog-body {
        padding: 24px 28px;
        flex: 1;
      }
      
      .save-confirm-dialog .dialog-message-wrapper {
        width: 100%;
      }

      .save-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 1.05rem;
        line-height: 1.6;
        margin: 0;
        text-align: left;
      }

      /* ダイアログフッター */
      .save-confirm-dialog .dialog-footer {
        padding: 20px 28px 28px;
        background: rgba(0, 0, 0, 0.1);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .save-confirm-dialog .dialog-buttons-wrapper {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      /* キーフレームアニメーション */
      @keyframes dialogFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes dialogFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes dialogSlideIn {
        from { 
          opacity: 0; 
          transform: translateY(-40px) scale(0.95);
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes dialogSlideOut {
        from { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
        to { 
          opacity: 0; 
          transform: translateY(-20px) scale(0.98);
        }
      }
      
      /* レスポンシブデザイン */
      @media (max-width: 480px) {
        .save-confirm-dialog .dialog-content {
          min-width: 300px;
          margin: 16px;
          border-radius: 16px;
        }
        
        .save-confirm-dialog .dialog-header {
          padding: 24px 24px 16px;
          gap: 12px;
        }
        
        .save-confirm-dialog .dialog-icon-wrapper {
          width: 40px;
          height: 40px;
        }
        
        .save-confirm-dialog .dialog-icon {
          font-size: 20px;
        }
        
        .save-confirm-dialog .dialog-title {
          font-size: 1.1rem;
        }
        
        .save-confirm-dialog .dialog-body {
          padding: 20px 24px;
        }
        
        .save-confirm-dialog .dialog-message {
          font-size: 1rem;
        }
        
        .save-confirm-dialog .dialog-footer {
          padding: 16px 24px 24px;
        }
        
        .save-confirm-dialog .dialog-buttons-wrapper {
          flex-direction: column;
          gap: 8px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // スタイル強制適用（他のCSSの干渉を防ぐ）
  dialog.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    box-sizing: border-box !important;
  `;

  // ダイアログ要素のスタイルを確実に適用
  const dialogContent = dialog.querySelector(".dialog-content");
  const dialogOverlay = dialog.querySelector(".dialog-overlay");
  const dialogDiscardBtn = dialog.querySelector(".discard-btn");
  const dialogCancelBtn = dialog.querySelector(".cancel-btn");
  const dialogSaveBtn = dialog.querySelector(".save-btn");
  const header = dialog.querySelector(".dialog-header");
  const iconWrapper = dialog.querySelector(".dialog-icon-wrapper");
  const icon = dialog.querySelector(".dialog-icon");

  // 各要素に確実にスタイルを適用
  if (dialogOverlay) {
    dialogOverlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(8px) !important;
      z-index: 999998 !important;
      width: 100% !important;
      height: 100% !important;
    `;
  }

  if (dialogContent) {
    dialogContent.style.cssText = `
      position: relative !important;
      background: #2D2D2D !important;
      border-radius: 20px !important;
      min-width: 340px !important;
      max-width: 420px !important;
      width: 100% !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 999999 !important;
      margin: 20px auto !important;
    `;
    const dialogTitle = dialogContent.querySelector(".dialog-title");
    if (dialogTitle) {
      dialogTitle.style.color = "#FFFFFF";
    }
    const dialogMessage = dialogContent.querySelector(".dialog-message");
    if (dialogMessage) {
      dialogMessage.style.color = "#BEC3C9";
      dialogMessage.style.lineHeight = "1.8";
      dialogMessage.style.margin = "0 0 8px 0";
    }
  }

  if (header) {
    header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 28px 28px 20px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      background: rgba(255, 255, 255, 0.02) !important;
    `;
  }

  if (iconWrapper) {
    iconWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 50% !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      flex-shrink: 0 !important;
    `;
  }

  if (icon) {
    icon.style.cssText = `
      font-size: 24px !important;
      color: #376DC7 !important;
      filter: none !important;
    `;
  }

  // ボタンスタイルを確実に適用
  if (dialogDiscardBtn) {
    dialogDiscardBtn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      background: linear-gradient(135deg, #dc3545 0%, #b91c1c 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(220, 53, 69, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.25s ease !important;
    `;
    dialogDiscardBtn.style.cssText += "color: #ffffff !important;";

    // ホバー効果を追加
    dialogDiscardBtn.addEventListener("mouseenter", () => {
      dialogDiscardBtn.style.background =
        "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
      dialogDiscardBtn.style.transform = "translateY(-2px)";
      dialogDiscardBtn.style.boxShadow = "0 6px 20px rgba(220, 53, 69, 0.4)";
    });
    dialogDiscardBtn.addEventListener("mouseleave", () => {
      dialogDiscardBtn.style.background =
        "linear-gradient(135deg, #dc3545 0%, #b91c1c 100%)";
      dialogDiscardBtn.style.transform = "translateY(0)";
      dialogDiscardBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  if (dialogCancelBtn) {
    dialogCancelBtn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      background: linear-gradient(135deg, #4a5568 0%, #374151 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(74, 85, 104, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.25s ease !important;
    `;
    dialogCancelBtn.style.cssText += "color: #ffffff !important;";

    // ホバー効果を追加
    dialogCancelBtn.addEventListener("mouseenter", () => {
      dialogCancelBtn.style.background =
        "linear-gradient(135deg, #374151 0%, #2d3748 100%)";
      dialogCancelBtn.style.transform = "translateY(-2px)";
      dialogCancelBtn.style.boxShadow = "0 6px 20px rgba(74, 85, 104, 0.4)";
    });
    dialogCancelBtn.addEventListener("mouseleave", () => {
      dialogCancelBtn.style.background =
        "linear-gradient(135deg, #4a5568 0%, #374151 100%)";
      dialogCancelBtn.style.transform = "translateY(0)";
      dialogCancelBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  if (dialogSaveBtn) {
    dialogSaveBtn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      background: linear-gradient(135deg, #00A31E 0%, #16a34a 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(0, 163, 30, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.25s ease !important;
    `;
    dialogSaveBtn.style.cssText += "color: #ffffff !important;";
    dialogSaveBtn.addEventListener("mouseenter", () => {
      dialogSaveBtn.style.background =
        "linear-gradient(135deg, #16a34a 0%, #00A31E 100%)";
      dialogSaveBtn.style.transform = "translateY(-2px)";
      dialogSaveBtn.style.boxShadow = "0 6px 20px rgba(0, 163, 30, 0.28)";
    });
    dialogSaveBtn.addEventListener("mouseleave", () => {
      dialogSaveBtn.style.background =
        "linear-gradient(135deg, #00A31E 0%, #16a34a 100%)";
      dialogSaveBtn.style.transform = "translateY(0)";
      dialogSaveBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  // イベントリスナー設定
  const overlay = dialogOverlay;
  const content = dialogContent;
  const discardBtn = dialogDiscardBtn;
  const cancelBtn = dialogCancelBtn;
  const saveBtn = dialogSaveBtn;

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 250);
  }

  // ボタンイベント
  if (discardBtn) {
    discardBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onDiscard) onDiscard();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onSave) onSave();
    });
  }

  // オーバーレイクリックで閉じる（キャンセル扱い）
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
      if (onCancel) onCancel();
    }
  });

  // ESCキーで閉じる（キャンセル扱い）
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
      document.removeEventListener("keydown", handleKeyDown);
    }
    // Enterキーで保存
    if (e.key === "Enter" && saveBtn) {
      e.preventDefault();
      closeDialog();
      if (onSave) onSave();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理とアクセシビリティ
  setTimeout(() => {
    // 最初は保存ボタンにフォーカス
    if (saveBtn) {
      saveBtn.focus();
    } else if (cancelBtn) {
      cancelBtn.focus();
    } else if (discardBtn) {
      discardBtn.focus();
    }
  }, 100);

  // フォーカストラップ（ダイアログ内でのタブ移動制限）
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  });

  // ボタンラッパーの横並びを強制
  let saveButtonsWrapper = dialog.querySelector(".dialog-buttons-wrapper");
  if (saveButtonsWrapper) {
    saveButtonsWrapper.style.display = "flex";
    saveButtonsWrapper.style.flexDirection = "row";
    saveButtonsWrapper.style.gap = "20px";
    saveButtonsWrapper.style.justifyContent = "flex-end";
    saveButtonsWrapper.style.flexWrap = "nowrap";
    // モバイルのみ縦並び
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      @media (max-width: 480px) {
        .dialog-buttons-wrapper {
          flex-direction: column !important;
          gap: 10px !important;
        }
      }
    `;
    document.head.appendChild(styleTag);
  }
};

/* ━━━━━━━━━━ 汎用削除確認ダイアログ ━━━━━━━━━━ */
window.AppUtils.showDeleteConfirmDialog = function (options = {}) {
  const {
    title: deleteTitle = "削除の確認",
    message:
      deleteMessage = "選択された1件のメモを完全に削除しますか？<br><span style='color: #D93544; font-weight: bold;'>この操作は取り消せません。</span>",
    onConfirm,
    onCancel,
    confirmLabel = "確認",
    cancelLabel = "キャンセル",
    confirmColor = "#3B82F6",
    cancelColor = "#4A5568",
    iconClass = "bi bi-question-circle",
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".delete-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成 - 保存確認ダイアログと同じ構造
  const dialog = document.createElement("div");
  dialog.className = "delete-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-icon-wrapper">
            <i class="${iconClass} dialog-icon"></i>
          </div>
          <div class="dialog-title-wrapper">
          <h3 class="dialog-title">${deleteTitle}</h3>
          </div>
        </div>
        <div class="dialog-body">
          <div class="dialog-message-wrapper">
          <p class="dialog-message">${deleteMessage}</p>
          </div>
        </div>
        <div class="dialog-footer">
          <div class="dialog-buttons-wrapper">
            <button class="dialog-btn cancel-btn" data-action="cancel">
              <i class="bi bi-x-circle"></i>
              <span>${cancelLabel}</span>
            </button>
            <button class="dialog-btn confirm-btn" data-action="confirm">
              <i class="bi bi-check-circle"></i>
              <span>${confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 改善されたスタイル - 保存確認ダイアログと統一
  if (!document.querySelector("#delete-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "delete-confirm-styles";
    styles.textContent = `
      /* ダイアログオーバーレイ - 最上位層 */
      .delete-confirm-dialog {
        position: fixed !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        box-sizing: border-box !important;
      }
      
      /* ダイアログオーバーレイ背景 */
      .delete-confirm-dialog .dialog-overlay {
        position: absolute !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.75) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        animation: dialogFadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 999998 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* ダイアログコンテンツ - メインコンテナ */
      .delete-confirm-dialog .dialog-content {
        position: relative !important;
        background: linear-gradient(135deg, #2a2f3a 0%, #23272f 100%);
        border-radius: 20px;
        min-width: 340px;
        max-width: 90vw;
        width: 100%;
        max-width: 420px;
        margin: 20px auto !important;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.6),
          0 8px 32px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 999999 !important;
        transform: translate(0, 0) !important;
      }
      
      /* ダイアログヘッダー */
      .delete-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 28px 28px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
      }
      
      .delete-confirm-dialog .dialog-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        flex-shrink: 0;
      }

      .delete-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #ffffff;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .delete-confirm-dialog .dialog-title-wrapper {
        flex: 1;
        min-width: 0;
      }

      .delete-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      /* ダイアログボディ */
      .delete-confirm-dialog .dialog-body {
        padding: 24px 28px;
        flex: 1;
      }
      
      .delete-confirm-dialog .dialog-message-wrapper {
        width: 100%;
      }

      .delete-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 1.05rem;
        line-height: 1.6;
        margin: 0;
        text-align: left;
      }

      /* ダイアログフッター */
      .delete-confirm-dialog .dialog-footer {
        padding: 20px 28px 28px;
        background: rgba(0, 0, 0, 0.1);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .delete-confirm-dialog .dialog-buttons-wrapper {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      /* キーフレームアニメーション */
      @keyframes dialogFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes dialogFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes dialogSlideIn {
        from { 
          opacity: 0; 
          transform: translateY(-40px) scale(0.95);
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes dialogSlideOut {
        from { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
        to { 
          opacity: 0; 
          transform: translateY(-20px) scale(0.98);
        }
      }
      
      /* レスポンシブデザイン */
      @media (max-width: 480px) {
        .delete-confirm-dialog .dialog-content {
          min-width: 300px;
          margin: 16px;
          border-radius: 16px;
        }
        
        .delete-confirm-dialog .dialog-header {
          padding: 24px 24px 16px;
          gap: 12px;
        }
        
        .delete-confirm-dialog .dialog-icon-wrapper {
          width: 40px;
          height: 40px;
        }
        
        .delete-confirm-dialog .dialog-icon {
          font-size: 20px;
        }
        
        .delete-confirm-dialog .dialog-title {
          font-size: 1.1rem;
        }
        
        .delete-confirm-dialog .dialog-body {
          padding: 20px 24px;
        }
        
        .delete-confirm-dialog .dialog-message {
          font-size: 1rem;
        }
        
        .delete-confirm-dialog .dialog-footer {
          padding: 16px 24px 24px;
        }
        
        .delete-confirm-dialog .dialog-buttons-wrapper {
          flex-direction: column;
          gap: 8px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // スタイル強制適用（他のCSSの干渉を防ぐ）
  dialog.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    box-sizing: border-box !important;
  `;

  // ダイアログ要素のスタイルを確実に適用
  const deleteContent = dialog.querySelector(".dialog-content");
  const deleteOverlay = dialog.querySelector(".dialog-overlay");
  const deleteCancelBtn = dialog.querySelector(".cancel-btn");
  const deleteConfirmBtn = dialog.querySelector(".confirm-btn");
  const deleteHeader = dialog.querySelector(".dialog-header");
  const deleteIconWrapper = dialog.querySelector(".dialog-icon-wrapper");
  const deleteIcon = dialog.querySelector(".dialog-icon");

  // 各要素に確実にスタイルを適用
  if (deleteOverlay) {
    deleteOverlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(8px) !important;
      z-index: 999998 !important;
      width: 100% !important;
      height: 100% !important;
      animation: dialogFadeIn 0.25s ease-out !important;
    `;
  }

  if (deleteContent) {
    deleteContent.style.cssText = `
      position: relative !important;
      background: #2D2D2D !important;
      border-radius: 20px !important;
      min-width: 340px !important;
      max-width: 420px !important;
      width: 100% !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 999999 !important;
      margin: 20px auto !important;
      animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    `;
    const dialogTitle = deleteContent.querySelector(".dialog-title");
    if (dialogTitle) {
      dialogTitle.style.color = "#FFFFFF";
    }
    const dialogMessage = deleteContent.querySelector(".dialog-message");
    if (dialogMessage) {
      dialogMessage.style.color = "#BEC3C9";
    }
  }

  if (deleteHeader) {
    deleteHeader.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 28px 28px 20px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      background: rgba(255, 255, 255, 0.02) !important;
    `;
  }

  if (deleteIconWrapper) {
    deleteIconWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 50% !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      flex-shrink: 0 !important;
    `;
  }

  if (deleteIcon) {
    deleteIcon.style.cssText = `
      font-size: 24px !important;
      color: #376DC7 !important;
      filter: none !important;
    `;
  }

  // ボタンスタイルを確実に適用
  if (deleteCancelBtn) {
    deleteCancelBtn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      background: linear-gradient(135deg, #4a5568 0%, #374151 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(74, 85, 104, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.25s ease !important;
    `;
    deleteCancelBtn.style.cssText += "color: #ffffff !important;";

    // ホバー効果を追加
    deleteCancelBtn.addEventListener("mouseenter", () => {
      deleteCancelBtn.style.background =
        "linear-gradient(135deg, #374151 0%, #2d3748 100%)";
      deleteCancelBtn.style.transform = "translateY(-2px)";
      deleteCancelBtn.style.boxShadow = "0 6px 20px rgba(74,85,104,0.4)";
    });
    deleteCancelBtn.addEventListener("mouseleave", () => {
      deleteCancelBtn.style.background =
        "linear-gradient(135deg, #4a5568 0%, #374151 100%)";
      deleteCancelBtn.style.transform = "translateY(0)";
      deleteCancelBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  if (deleteConfirmBtn) {
    deleteConfirmBtn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(59, 130, 246, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.25s ease !important;
    `;
    deleteConfirmBtn.style.cssText += "color: #ffffff !important;";

    // ホバー効果を追加
    deleteConfirmBtn.addEventListener("mouseenter", () => {
      deleteConfirmBtn.style.background =
        "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)";
      deleteConfirmBtn.style.transform = "translateY(-2px)";
      deleteConfirmBtn.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
    });
    deleteConfirmBtn.addEventListener("mouseleave", () => {
      deleteConfirmBtn.style.background =
        "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
      deleteConfirmBtn.style.transform = "translateY(0)";
      deleteConfirmBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  // イベントリスナー設定
  const overlay = deleteOverlay;
  const content = deleteContent;
  const cancelBtn = deleteCancelBtn;
  const confirmBtn = deleteConfirmBtn;

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 250);
  }

  // ボタンイベント
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
    });
  }
  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onConfirm) onConfirm();
    });
  }

  // オーバーレイクリックで閉じる（キャンセル扱い）
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
      if (onCancel) onCancel();
    }
  });

  // ESCキーで閉じる（キャンセル扱い）
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
      document.removeEventListener("keydown", handleKeyDown);
    }
    // Enterキーで確認
    if (e.key === "Enter" && confirmBtn) {
      e.preventDefault();
      closeDialog();
      if (onConfirm) onConfirm();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理とアクセシビリティ
  setTimeout(() => {
    // 最初は確認ボタンにフォーカス
    if (confirmBtn) {
      confirmBtn.focus();
    } else if (cancelBtn) {
      cancelBtn.focus();
    }
  }, 100);

  // フォーカストラップ（ダイアログ内でのタブ移動制限）
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  });

  // ボタンラッパーの横並びを強制
  let deleteButtonsWrapper = dialog.querySelector(".dialog-buttons-wrapper");
  if (deleteButtonsWrapper) {
    deleteButtonsWrapper.style.display = "flex";
    deleteButtonsWrapper.style.flexDirection = "row";
    deleteButtonsWrapper.style.gap = "16px";
    deleteButtonsWrapper.style.justifyContent = "flex-end";
    deleteButtonsWrapper.style.flexWrap = "nowrap";
    // モバイルのみ縦並び
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      @media (max-width: 480px) {
        .dialog-buttons-wrapper {
          flex-direction: column !important;
          gap: 8px !important;
        }
      }
    `;
    document.head.appendChild(styleTag);
  }
};

/* ━━━━━━━━━━ 汎用確認ダイアログ ━━━━━━━━━━ */
window.AppUtils.showConfirmDialog = function (options = {}) {
  const {
    title = "確認",
    message = "この操作を実行しますか？",
    onConfirm,
    onCancel,
    confirmLabel = "確認",
    cancelLabel = "キャンセル",
    confirmColor = "#3b82f6",
    cancelColor = "#4a5568",
    iconClass = "bi bi-question-circle",
  } = options;

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成 - 保存確認ダイアログと同じ構造
  const dialog = document.createElement("div");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-icon-wrapper">
            <i class="${iconClass} dialog-icon"></i>
          </div>
          <div class="dialog-title-wrapper">
          <h3 class="dialog-title">${title}</h3>
          </div>
        </div>
        <div class="dialog-body">
          <div class="dialog-message-wrapper">
          <p class="dialog-message">${message}</p>
          </div>
        </div>
        <div class="dialog-footer">
          <div class="dialog-buttons-wrapper">
            <button class="dialog-btn cancel-btn" data-action="cancel">
              <i class="bi bi-x-circle"></i>
              <span>${cancelLabel}</span>
            </button>
            <button class="dialog-btn confirm-btn" data-action="confirm">
              <i class="bi bi-check-circle"></i>
              <span>${confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 改善されたスタイル - 保存確認ダイアログと統一
  if (!document.querySelector("#confirm-dialog-styles")) {
    const styles = document.createElement("style");
    styles.id = "confirm-dialog-styles";
    styles.textContent = `
      /* ダイアログオーバーレイ - 最上位層 */
      .confirm-dialog {
        position: fixed !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        box-sizing: border-box !important;
      }
      
      /* ダイアログオーバーレイ背景 */
      .confirm-dialog .dialog-overlay {
        position: absolute !important;
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.75) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        animation: dialogFadeIn 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 999998 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* ダイアログコンテンツ - メインコンテナ */
      .confirm-dialog .dialog-content {
        position: relative !important;
        background: linear-gradient(135deg, #2a2f3a 0%, #23272f 100%);
        border-radius: 20px;
        min-width: 340px;
        max-width: 90vw;
        width: 100%;
        max-width: 420px;
        margin: 20px auto !important;
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.6),
          0 8px 32px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 999999 !important;
        transform: translate(0, 0) !important;
      }
      
      /* ダイアログヘッダー */
      .confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 28px 28px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
      }
      
      .confirm-dialog .dialog-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        flex-shrink: 0;
      }

      .confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #ffffff;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }
      
      .confirm-dialog .dialog-title-wrapper {
        flex: 1;
        min-width: 0;
      }

      .confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      /* ダイアログボディ */
      .confirm-dialog .dialog-body {
        padding: 24px 28px;
        flex: 1;
      }
      
      .confirm-dialog .dialog-message-wrapper {
        width: 100%;
      }

      .confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 1.05rem;
        line-height: 1.6;
        margin: 0;
        text-align: left;
      }

      /* ダイアログフッター */
      .confirm-dialog .dialog-footer {
        padding: 20px 28px 28px;
        background: rgba(0, 0, 0, 0.1);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .confirm-dialog .dialog-buttons-wrapper {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      /* キーフレームアニメーション */
      @keyframes dialogFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes dialogFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes dialogSlideIn {
        from {
          opacity: 0;
          transform: translateY(-40px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes dialogSlideOut {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(-20px) scale(0.98);
        }
      }
      
      /* レスポンシブデザイン */
      @media (max-width: 480px) {
        .confirm-dialog .dialog-content {
          min-width: 300px;
          margin: 16px;
          border-radius: 16px;
        }
        
        .confirm-dialog .dialog-header {
          padding: 24px 24px 16px;
          gap: 12px;
        }
        
        .confirm-dialog .dialog-icon-wrapper {
          width: 40px;
          height: 40px;
        }
        
        .confirm-dialog .dialog-icon {
          font-size: 20px;
        }
        
        .confirm-dialog .dialog-title {
          font-size: 1.1rem;
        }
        
        .confirm-dialog .dialog-body {
          padding: 20px 24px;
        }
        
        .confirm-dialog .dialog-message {
          font-size: 1rem;
        }
        
        .confirm-dialog .dialog-footer {
          padding: 16px 24px 24px;
        }
        
        .confirm-dialog .dialog-buttons-wrapper {
          flex-direction: column;
          gap: 8px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // DOMに追加
  document.body.appendChild(dialog);

  // スタイル強制適用（他のCSSの干渉を防ぐ）
  dialog.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    box-sizing: border-box !important;
  `;

  // ダイアログ要素のスタイルを確実に適用
  const confirmContent = dialog.querySelector(".dialog-content");
  const confirmOverlay = dialog.querySelector(".dialog-overlay");
  const confirmCancelBtn = dialog.querySelector(".cancel-btn");
  const confirmConfirmBtn = dialog.querySelector(".confirm-btn");
  const confirmHeader = dialog.querySelector(".dialog-header");
  const confirmIconWrapper = dialog.querySelector(".dialog-icon-wrapper");
  const confirmIcon = dialog.querySelector(".dialog-icon");

  // 各要素に確実にスタイルを適用
  if (confirmOverlay) {
    confirmOverlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(8px) !important;
      z-index: 999998 !important;
      width: 100% !important;
      height: 100% !important;
      animation: dialogFadeIn 0.25s ease-out !important;
    `;
  }

  if (confirmContent) {
    confirmContent.style.cssText = `
      position: relative !important;
      background: #2D2D2D !important;
      border-radius: 20px !important;
      min-width: 340px !important;
      max-width: 420px !important;
      width: 100% !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 999999 !important;
      margin: 20px auto !important;
      animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    `;
    const dialogTitle = confirmContent.querySelector(".dialog-title");
    if (dialogTitle) {
      dialogTitle.style.color = "#FFFFFF";
    }
    const dialogMessage = confirmContent.querySelector(".dialog-message");
    if (dialogMessage) {
      dialogMessage.style.color = "#BEC3C9";
    }
  }

  if (confirmHeader) {
    confirmHeader.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 28px 28px 20px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      background: rgba(255, 255, 255, 0.02) !important;
    `;
  }

  if (confirmIconWrapper) {
    confirmIconWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 50% !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      flex-shrink: 0 !important;
    `;
  }

  if (confirmIcon) {
    confirmIcon.style.cssText = `
      font-size: 24px !important;
      color: #376DC7 !important;
      filter: none !important;
    `;
  }

  // タイトルとメッセージのスタイルも確実に適用
  const confirmTitle = dialog.querySelector(".dialog-title");
  const confirmMessage = dialog.querySelector(".dialog-message");
  const body = dialog.querySelector(".dialog-body");
  const footer = dialog.querySelector(".dialog-footer");
  const buttonsWrapper = dialog.querySelector(".dialog-buttons-wrapper");

  if (confirmTitle) {
    confirmTitle.style.cssText = `
      color: #fff !important;
      font-size: 1.25rem !important;
      font-weight: 700 !important;
      margin: 0 0 4px 0 !important;
      line-height: 1.3 !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.18) !important;
      letter-spacing: 0.01em !important;
    `;
  }
  if (confirmMessage) {
    confirmMessage.style.cssText = `
      color: #e2e8f0 !important;
      font-size: 1.05rem !important;
      line-height: 1.7 !important;
      margin: 0 !important;
      text-align: left !important;
      font-weight: 400 !important;
      opacity: 1 !important;
    `;
  }
  if (body) {
    body.style.cssText = `
      padding: 18px 24px 10px 24px !important;
      flex: 1 !important;
      background: none !important;
    `;
  }
  if (footer) {
    footer.style.cssText = `
      padding: 12px 24px 20px 24px !important;
      background: none !important;
      border-top: 1px solid rgba(255,255,255,0.10) !important;
    `;
  }
  if (buttonsWrapper) {
    buttonsWrapper.style.cssText = `
      display: flex !important;
      flex-direction: row !important;
      gap: 16px !important;
      justify-content: flex-start !important;
      align-items: center !important;
      margin-top: 0 !important;
      width: 100% !important;
    `;
  }
  // ボタン共通
  const allBtns = dialog.querySelectorAll(".dialog-btn");
  allBtns.forEach((btn) => {
    btn.style.minWidth = "96px";
    btn.style.height = "44px";
    btn.style.fontSize = "1rem";
    btn.style.fontWeight = "600";
    btn.style.borderRadius = "10px";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.gap = "8px";
    btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
    btn.style.padding = "0 18px";
    btn.style.border = "none";
    btn.style.transition = "all 0.18s cubic-bezier(.4,1.2,.6,1)";
  });
  // 破棄ボタン
  const discardBtn = dialog.querySelector(".discard-btn");
  if (discardBtn) {
    discardBtn.style.background =
      "linear-gradient(135deg, #dc3545 0%, #b91c1c 100%)";
    discardBtn.style.color = "#fff";
    discardBtn.style.border = "none";
    discardBtn.style.boxShadow = "0 2px 8px rgba(220,53,69,0.18)";
    discardBtn.addEventListener("mouseenter", () => {
      discardBtn.style.background =
        "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
      discardBtn.style.transform = "translateY(-2px)";
      discardBtn.style.boxShadow = "0 6px 20px rgba(220,53,69,0.28)";
    });
    discardBtn.addEventListener("mouseleave", () => {
      discardBtn.style.background =
        "linear-gradient(135deg, #dc3545 0%, #b91c1c 100%)";
      discardBtn.style.transform = "translateY(0)";
      discardBtn.style.boxShadow = "0 2px 8px rgba(220,53,69,0.18)";
    });
  }
  if (discardBtn) {
    discardBtn.style.color = "#ffffff";
  }
  // キャンセルボタン
  const confirmCancelBtn2 = dialog.querySelector(".cancel-btn");
  if (confirmCancelBtn2) {
    confirmCancelBtn2.style.background =
      "linear-gradient(135deg, #4a5568 0%, #374151 100%)";
    confirmCancelBtn2.style.color = "#fff";
    confirmCancelBtn2.style.border = "none";
    confirmCancelBtn2.style.boxShadow = "0 2px 8px rgba(74,85,104,0.18)";
    confirmCancelBtn2.addEventListener("mouseenter", () => {
      confirmCancelBtn2.style.background =
        "linear-gradient(135deg, #374151 0%, #2d3748 100%)";
      confirmCancelBtn2.style.transform = "translateY(-2px)";
      confirmCancelBtn2.style.boxShadow = "0 6px 20px rgba(74,85,104,0.28)";
    });
    confirmCancelBtn2.addEventListener("mouseleave", () => {
      confirmCancelBtn2.style.background =
        "linear-gradient(135deg, #4a5568 0%, #374151 100%)";
      confirmCancelBtn2.style.transform = "translateY(0)";
      confirmCancelBtn2.style.boxShadow = "0 2px 8px rgba(74,85,104,0.18)";
    });
  }
  if (confirmCancelBtn2) {
    confirmCancelBtn2.style.color = "#ffffff";
  }
  // 保存ボタン
  const saveBtn = dialog.querySelector(".save-btn");
  if (saveBtn) {
    saveBtn.style.background =
      "linear-gradient(135deg, #00A31E 0%, #16a34a 100%)";
    saveBtn.style.color = "#fff";
    saveBtn.style.border = "none";
    saveBtn.style.boxShadow = "0 2px 8px rgba(0, 163, 30, 0.18)";
    saveBtn.addEventListener("mouseenter", () => {
      saveBtn.style.background =
        "linear-gradient(135deg, #16a34a 0%, #00A31E 100%)";
      saveBtn.style.transform = "translateY(-2px)";
      saveBtn.style.boxShadow = "0 6px 20px rgba(0, 163, 30, 0.28)";
    });
    saveBtn.addEventListener("mouseleave", () => {
      saveBtn.style.background =
        "linear-gradient(135deg, #00A31E 0%, #16a34a 100%)";
      saveBtn.style.transform = "translateY(0)";
      saveBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }
  if (saveBtn) {
    saveBtn.style.color = "#ffffff";
  }
  // アイコンとテキストの間隔
  const btnIcons = dialog.querySelectorAll(".dialog-btn i");
  btnIcons.forEach((icon) => {
    icon.style.fontSize = "18px";
    icon.style.marginRight = "4px";
  });
  // ダイアログ本体
  const dialogContent = dialog.querySelector(".dialog-content");
  if (dialogContent) {
    dialogContent.style.background =
      "linear-gradient(135deg, #23272f 0%, #2a2f3a 100%)";
    dialogContent.style.borderRadius = "14px";
    dialogContent.style.boxShadow =
      "0 8px 32px rgba(0,0,0,0.28), 0 1.5px 4px rgba(0,0,0,0.10)";
    dialogContent.style.border = "1px solid rgba(255,255,255,0.10)";
    dialogContent.style.padding = "0";
    dialogContent.style.minWidth = "320px";
    dialogContent.style.maxWidth = "400px";
    dialogContent.style.width = "100%";
    dialogContent.style.margin = "0 auto";
  }

  // イベントリスナー設定
  const overlay = confirmOverlay;
  const content = confirmContent;
  const cancelBtn = confirmCancelBtn;
  const confirmBtn = confirmConfirmBtn;

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 250);
  }

  // ボタンイベント
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
    });
  }
  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeDialog();
      if (onConfirm) onConfirm();
    });
  }

  // オーバーレイクリックで閉じる（キャンセル扱い）
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
      if (onCancel) onCancel();
    }
  });

  // ESCキーで閉じる（キャンセル扱い）
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      if (onCancel) onCancel();
      document.removeEventListener("keydown", handleKeyDown);
    }
    // Enterキーで確認
    if (e.key === "Enter" && confirmBtn) {
      e.preventDefault();
      closeDialog();
      if (onConfirm) onConfirm();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理とアクセシビリティ
  setTimeout(() => {
    // 最初は確認ボタンにフォーカス
    if (confirmBtn) {
      confirmBtn.focus();
    } else if (cancelBtn) {
      cancelBtn.focus();
    }
  }, 100);

  // フォーカストラップ（ダイアログ内でのタブ移動制限）
  const focusableElements = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  });

  // ボタンラッパーの横並びを強制
  let confirmButtonsWrapper = dialog.querySelector(".dialog-buttons-wrapper");
  if (confirmButtonsWrapper) {
    confirmButtonsWrapper.style.display = "flex";
    confirmButtonsWrapper.style.flexDirection = "row";
    confirmButtonsWrapper.style.gap = "16px";
    confirmButtonsWrapper.style.justifyContent = "flex-end";
    confirmButtonsWrapper.style.flexWrap = "nowrap";
    // モバイルのみ縦並び
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      @media (max-width: 480px) {
        .dialog-buttons-wrapper {
          flex-direction: column !important;
          gap: 8px !important;
        }
      }
    `;
    document.head.appendChild(styleTag);
  }
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
    // メモページ: .actions (bi bi-archive-fill actions)
    // プロンプトページ: .prompt-archive
    // クリップボードページ: .clipboard-archive i
    const archiveIcon =
      element.querySelector(".actions") ||
      element.querySelector(".prompt-archive") ||
      element.querySelector(".clipboard-archive i");

    console.log("[ARCHIVE] アーカイブアイコン検索:", {
      element: element,
      actionsIcon: element.querySelector(".actions"),
      promptIcon: element.querySelector(".prompt-archive"),
      clipboardIcon: element.querySelector(".clipboard-archive i"),
      foundIcon: archiveIcon,
    });

    if (archiveIcon) {
      console.log("[AppUtils] Highlight archive icon", archiveIcon);
      archiveIcon.classList.add("archive-icon-highlight");
    } else {
      console.warn("[AppUtils] Archive icon not found for highlight");
    }

    console.log("[ARCHIVE] アニメーション開始前の要素状態:", {
      element: element,
      className: element.className,
      computedStyle: window.getComputedStyle(element),
    });

    // 既存のアニメーションクラスを削除（もしあれば）
    element.classList.remove(
      "archiving-left",
      "archiving-right",
      "archiving-down"
    );

    // archive-itemクラスを追加（CSSセレクタのため）
    element.classList.add("archive-item");

    // 強制的にリフローを発生させてクラス削除を確定（CSP準拠）
    element.getBoundingClientRect();

    // 選択されたアニメーションクラスを追加
    element.classList.add(animationClass);

    console.log("[ARCHIVE] アニメーションクラスを追加:", {
      element: element,
      classes: element.className,
      animationClass: animationClass,
    });

    // アニメーション開始を確実にするための強制リフロー
    element.getBoundingClientRect();

    // アニメーション開始直後の状態を確認
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(element);
      console.log("[ARCHIVE] アニメーション開始後の状態:", {
        element: element,
        animation: computedStyle.animation,
        transform: computedStyle.transform,
        opacity: computedStyle.opacity,
        pointerEvents: computedStyle.pointerEvents,
        hasAnimation: computedStyle.animation !== "none",
      });

      // アニメーションが開始されていない場合のフォールバック
      if (computedStyle.animation === "none") {
        console.warn(
          "[ARCHIVE] アニメーションが開始されていません。フォールバック処理を実行します。"
        );
        // フォールバック用のクラスを追加
        element.classList.add("archive-fallback-animating");

        // フォールバックアニメーション用のスタイルを動的に追加
        if (!document.querySelector("#archive-fallback-styles")) {
          const fallbackStyles = document.createElement("style");
          fallbackStyles.id = "archive-fallback-styles";
          fallbackStyles.textContent = `
            .archive-fallback-animating {
              transition: all 0.6s ease-in-out !important;
              transform: translateY(-50px) scale(0.8) !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `;
          document.head.appendChild(fallbackStyles);
        }
      }
    }, 50);

    // アニメーション用スタイルを必ず追加（初回のみ）
    let styleTag = document.getElementById("archive-animation-styles");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "archive-animation-styles";
      styleTag.textContent = `
        .archive-item.archiving-left {
          animation: archiveSlideOutLeft 0.6s ease-in-out forwards !important;
          pointer-events: none !important;
          transition: none !important;
          will-change: transform, opacity !important;
        }
        .archive-item.archiving-right {
          animation: archiveSlideOutRight 0.6s ease-in-out forwards !important;
          pointer-events: none !important;
          transition: none !important;
          will-change: transform, opacity !important;
        }
        .archive-item.archiving-down {
          animation: archiveFallDown 0.8s ease-in forwards !important;
          pointer-events: none !important;
          transition: none !important;
          will-change: transform, opacity !important;
        }
        @keyframes archiveSlideOutLeft {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          30% { opacity: 0.8; transform: translateX(-10px) scale(0.98); }
          60% { opacity: 0.4; transform: translateX(-30px) scale(0.95) rotateZ(-2deg); }
          100% { opacity: 0; transform: translateX(-100px) scale(0.8) rotateZ(-5deg); height: 0; margin: 0; padding: 0; }
        }
        @keyframes archiveSlideOutRight {
          0% { opacity: 1; transform: translateX(0) scale(1); }
          30% { opacity: 0.8; transform: translateX(10px) scale(0.98); }
          60% { opacity: 0.4; transform: translateX(30px) scale(0.95) rotateZ(2deg); }
          100% { opacity: 0; transform: translateX(100px) scale(0.8) rotateZ(5deg); height: 0; margin: 0; padding: 0; }
        }
        @keyframes archiveFallDown {
          0% { opacity: 1; transform: translateY(0) scale(1) rotateZ(0deg); }
          20% { opacity: 0.9; transform: translateY(10px) scale(0.98) rotateZ(2deg); }
          40% { opacity: 0.7; transform: translateY(30px) scale(0.95) rotateZ(-3deg); }
          60% { opacity: 0.5; transform: translateY(60px) scale(0.9) rotateZ(5deg); }
          80% { opacity: 0.2; transform: translateY(100px) scale(0.8) rotateZ(-8deg); }
          100% { opacity: 0; transform: translateY(150px) scale(0.6) rotateZ(15deg); height: 0; margin: 0; padding: 0; }
        }
        .archive-icon-highlight {
          color: #f59e0b !important;
          transform: scale(1.2) !important;
          transition: all 0.2s ease !important;
          will-change: transform, color !important;
        }
        .slide-up-animating {
          animation: slideUp 0.3s ease-out both !important;
          will-change: transform, opacity !important;
        }
      `;
      document.head.appendChild(styleTag);
      console.log("[ARCHIVE] アニメーションスタイルを追加しました");
    } else {
      console.log("[ARCHIVE] アニメーションスタイルは既に存在します");
    }

    // animationend イベントリスナーを使用してより確実にアニメーション完了を検知
    const handleAnimationEnd = async (event) => {
      console.log("[ARCHIVE] アニメーションイベント発生:", {
        animationName: event.animationName,
        target: event.target,
        type: event.type,
      });

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
          // 既存のアニメーションクラスをクリア
          item.classList.remove(
            "archive-item-animating",
            "restore-item-animating",
            "slide-up-animating"
          );

          // 強制的にリフローを発生させて状態をリセット（CSP準拠）
          item.getBoundingClientRect();

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.classList.add("slide-up-animating");

            // アニメーション完了後にクラスをクリーンアップ
            setTimeout(() => {
              item.classList.remove("slide-up-animating");
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
    console.log("[ARCHIVE] アニメーションイベントリスナーを設定:", {
      element: element,
      hasAnimationEndListener: true,
    });

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
          // 既存のアニメーションクラスをクリア
          item.classList.remove(
            "archive-item-animating",
            "restore-item-animating",
            "slide-up-animating"
          );

          // 強制的にリフローを発生させて状態をリセット（CSP準拠）
          item.getBoundingClientRect();

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.classList.add("slide-up-animating");

            // アニメーション完了後にクラスをクリーンアップ
            setTimeout(() => {
              item.classList.remove("slide-up-animating");
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
  toast.className = "drag-drop-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    <span>アーカイブへ移動しました</span>
  `;

  // bodyに追加
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 10);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
};

/* ━━━━━━━━━━ 復元アニメーション機能 ━━━━━━━━━━ */

// 復元アニメーション（上にアニメーションして消える）
async function animateRestoreItem(item, callback) {
  return new Promise((resolve) => {
    // アニメーション用スタイルを動的に追加（初回のみ）
    if (!document.querySelector("#restore-animation-styles")) {
      const styles = document.createElement("style");
      styles.id = "restore-animation-styles";
      styles.textContent = `
        .restore-item-animating {
          transition: all 0.5s ease-in-out !important;
          transform: translateY(-50px) scale(0.9) !important;
          opacity: 0 !important;
          filter: blur(2px) !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(styles);
    }

    // アニメーション開始
    item.classList.add("restore-item-animating");

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

// 共通トースト通知機能
function showToast(message, type = "info") {
  console.log("[UTILS] showToast呼び出し:", { message, type });

  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".common-toast-message");
  if (existingToast) {
    console.log("[UTILS] 既存のトーストを削除");
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

  console.log("[UTILS] トースト設定:", {
    icon,
    borderColor,
    bgColor,
    iconColor,
  });

  // トーストHTML
  const toast = document.createElement("div");
  toast.className = "common-toast-message";
  toast.innerHTML = `
    <span class="toast-icon" style="color: ${iconColor}">${icon}</span>
    <span class="toast-text">${message}</span>
  `;

  console.log("[UTILS] トースト要素作成:", toast);

  // スタイルを動的に追加（初回のみ）
  if (!document.querySelector("#common-toast-styles")) {
    console.log("[UTILS] トーストスタイルを追加");
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
    console.log("[UTILS] トーストスタイル追加完了");
  }

  // bodyに追加
  document.body.appendChild(toast);
  console.log("[UTILS] トースト要素をbodyに追加:", toast);

  // アニメーションで表示
  setTimeout(() => {
    toast.classList.add("show");
    console.log("[UTILS] トースト表示アニメーション開始");
  }, 50);

  // 2秒後にフェードアウト
  setTimeout(() => {
    toast.classList.remove("show");
    console.log("[UTILS] トースト非表示アニメーション開始");
    setTimeout(() => {
      toast.remove();
      console.log("[UTILS] トースト要素を削除");
    }, 300);
  }, 2000);
}

console.log("[UTILS] AppUtils loaded successfully");

// グローバルに公開
window.AppUtils = {
  showConfirmDialog,
  showSaveConfirmDialog,
  showToast,
  showArchiveToast,
  animateArchiveItem,
  animateRestoreItem,
};

// ダミー実装: showConfirmDialog
function showConfirmDialog(options = {}) {
  // 必要に応じてカスタムダイアログを実装
  alert(options.message || "確認ダイアログ");
  if (typeof options.onConfirm === "function") options.onConfirm();
}
