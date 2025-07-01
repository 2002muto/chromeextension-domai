// File: pages/common.js
// ナビゲーションボタンのクリック時展開機能

// ページ状態管理のためのユーティリティ関数
const PageStateManager = {
  // ページ状態を保存
  savePageState: (pageName, state) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      pageStates[pageName] = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を保存:`, state);
    } catch (error) {
      console.error("[PageState] 状態保存エラー:", error);
    }
  },

  // ページ状態を取得
  getPageState: (pageName) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      return pageStates[pageName] || null;
    } catch (error) {
      console.error("[PageState] 状態取得エラー:", error);
      return null;
    }
  },

  // ページ状態を更新
  updatePageState: (pageName, updates) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      pageStates[pageName] = {
        ...pageStates[pageName],
        ...updates,
        timestamp: Date.now(),
      };
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を更新:`, updates);
    } catch (error) {
      console.error("[PageState] 状態更新エラー:", error);
    }
  },

  // ページ状態を削除
  clearPageState: (pageName) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      delete pageStates[pageName];
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を削除`);
    } catch (error) {
      console.error("[PageState] 状態削除エラー:", error);
    }
  },

  // 現在アクティブなページを保存
  setActivePage: (pageName) => {
    try {
      localStorage.setItem("activePage", pageName);
      console.log(`[PageState] アクティブページを設定: ${pageName}`);
    } catch (error) {
      console.error("[PageState] アクティブページ保存エラー:", error);
    }
  },

  // 現在アクティブなページを取得
  getActivePage: () => {
    try {
      return localStorage.getItem("activePage") || null;
    } catch (error) {
      console.error("[PageState] アクティブページ取得エラー:", error);
      return null;
    }
  },
};

// グローバルに公開
window.PageStateManager = PageStateManager;
window.restoreMemoPageState = restoreMemoPageState;
window.restorePromptPageState = restorePromptPageState;
window.restoreClipboardPageState = restoreClipboardPageState;
window.restoreAIPageState = restoreAIPageState;
window.restoreSettingPageState = restoreSettingPageState;

// 各ページの状態復元関数
function restoreMemoPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] MEMOページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderListView === "function") {
          window.renderListView();
        } else if (typeof renderListView === "function") {
          renderListView();
        }
        break;
      case "edit":
        if (savedState.memoId && typeof window.renderInputForm === "function") {
          window.renderInputForm(savedState.memoId);
        } else if (savedState.memoId && typeof renderInputForm === "function") {
          renderInputForm(savedState.memoId);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveNav === "function") {
          window.renderArchiveNav("memo");
        } else if (typeof renderArchiveNav === "function") {
          renderArchiveNav("memo");
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderListView === "function") {
          window.renderListView();
        } else if (typeof renderListView === "function") {
          renderListView();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderListView === "function") {
      window.renderListView();
    } else if (typeof renderListView === "function") {
      renderListView();
    }
  }
}

function restorePromptPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] PROMPTページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderList === "function") {
          window.renderList();
        } else if (typeof renderList === "function") {
          renderList();
        }
        break;
      case "edit":
        if (
          savedState.promptIndex !== undefined &&
          typeof window.renderEdit === "function"
        ) {
          window.renderEdit(savedState.promptIndex, savedState.isNew);
        } else if (
          savedState.promptIndex !== undefined &&
          typeof renderEdit === "function"
        ) {
          renderEdit(savedState.promptIndex, savedState.isNew);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      case "run":
        if (
          savedState.promptIndex !== undefined &&
          typeof window.renderRun === "function"
        ) {
          window.renderRun(savedState.promptIndex);
        } else if (
          savedState.promptIndex !== undefined &&
          typeof renderRun === "function"
        ) {
          renderRun(savedState.promptIndex);
        } else {
          // 実行画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveView === "function") {
          window.renderArchiveView();
        } else if (typeof renderArchiveView === "function") {
          renderArchiveView();
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderList === "function") {
          window.renderList();
        } else if (typeof renderList === "function") {
          renderList();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderList === "function") {
      window.renderList();
    } else if (typeof renderList === "function") {
      renderList();
    }
  }
}

function restoreClipboardPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] CLIPBOARDページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderClipboardView === "function") {
          window.renderClipboardView();
        } else if (typeof renderClipboardView === "function") {
          renderClipboardView();
        }
        break;
      case "edit":
        if (
          savedState.clipIndex !== undefined &&
          typeof window.renderClipboardEdit === "function"
        ) {
          window.renderClipboardEdit(savedState.clipIndex);
        } else if (
          savedState.clipIndex !== undefined &&
          typeof renderClipboardEdit === "function"
        ) {
          renderClipboardEdit(savedState.clipIndex);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderClipboardView === "function") {
            window.renderClipboardView();
          } else if (typeof renderClipboardView === "function") {
            renderClipboardView();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveNav === "function") {
          window.renderArchiveNav("clip");
        } else if (typeof renderArchiveNav === "function") {
          renderArchiveNav("clip");
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderClipboardView === "function") {
            window.renderClipboardView();
          } else if (typeof renderClipboardView === "function") {
            renderClipboardView();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderClipboardView === "function") {
          window.renderClipboardView();
        } else if (typeof renderClipboardView === "function") {
          renderClipboardView();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderClipboardView === "function") {
      window.renderClipboardView();
    } else if (typeof renderClipboardView === "function") {
      renderClipboardView();
    }
  }
}

function restoreAIPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] AIページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "main":
        if (typeof window.renderAIMain === "function") {
          window.renderAIMain();
        } else if (typeof renderAIMain === "function") {
          renderAIMain();
        }
        break;
      default:
        // デフォルトはメイン画面
        if (typeof window.renderAIMain === "function") {
          window.renderAIMain();
        } else if (typeof renderAIMain === "function") {
          renderAIMain();
        }
    }
  } else {
    // 保存された状態がない場合はメイン画面
    if (typeof window.renderAIMain === "function") {
      window.renderAIMain();
    } else if (typeof renderAIMain === "function") {
      renderAIMain();
    }
  }
}

function restoreSettingPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] 設定ページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "main":
        if (typeof window.renderSettingMain === "function") {
          window.renderSettingMain();
        } else if (typeof renderSettingMain === "function") {
          renderSettingMain();
        }
        break;
      default:
        // デフォルトはメイン画面
        if (typeof window.renderSettingMain === "function") {
          window.renderSettingMain();
        } else if (typeof renderSettingMain === "function") {
          renderSettingMain();
        }
    }
  } else {
    // 保存された状態がない場合はメイン画面
    if (typeof window.renderSettingMain === "function") {
      window.renderSettingMain();
    } else if (typeof renderSettingMain === "function") {
      renderSettingMain();
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("[PageState] DOMContentLoaded - ページ状態管理システム初期化");

  // 現在のページを確認
  const currentPage = window.location.pathname;
  let currentPageName = null;

  if (currentPage.includes("/memo/")) {
    currentPageName = "memo";
  } else if (currentPage.includes("/prompt/")) {
    currentPageName = "prompt";
  } else if (currentPage.includes("/clipboard/")) {
    currentPageName = "clipboard";
  } else if (currentPage.includes("/ai/")) {
    currentPageName = "ai";
  } else if (currentPage.includes("/setting/")) {
    currentPageName = "setting";
  }

  console.log(
    "[PageState] 現在のページ:",
    currentPageName,
    "パス:",
    currentPage
  );

  // アクティブページを確認
  const activePage = PageStateManager.getActivePage();
  console.log("[PageState] 保存されたアクティブページ:", activePage);

  // 現在のページとアクティブページが一致しない場合の処理
  if (activePage !== currentPageName) {
    console.log(
      "[PageState] アクティブページを現在のページに更新:",
      activePage,
      "→",
      currentPageName
    );
    PageStateManager.setActivePage(currentPageName);
  }

  // 現在のページの状態を復元
  if (currentPageName) {
    const savedState = PageStateManager.getPageState(currentPageName);
    console.log("[PageState] 保存された状態:", savedState);

    // 各ページの状態復元関数を呼び出し
    switch (currentPageName) {
      case "memo":
        if (typeof window.restoreMemoPageState === "function") {
          window.restoreMemoPageState(savedState);
        }
        break;
      case "prompt":
        if (typeof window.restorePromptPageState === "function") {
          window.restorePromptPageState(savedState);
        }
        break;
      case "clipboard":
        if (typeof window.restoreClipboardPageState === "function") {
          window.restoreClipboardPageState(savedState);
        }
        break;
      case "ai":
        if (typeof window.restoreAIPageState === "function") {
          window.restoreAIPageState(savedState);
        }
        break;
      case "setting":
        if (typeof window.restoreSettingPageState === "function") {
          window.restoreSettingPageState(savedState);
        }
        break;
    }
  }

  // 全てのナビゲーションボタンを取得
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach((button) => {
    // クリック時のイベントリスナーを追加
    button.addEventListener("click", function (e) {
      // 現在のページへのリンクの場合はページ遷移を防ぐ
      if (this.classList.contains("active")) {
        e.preventDefault();

        // アクティブなボタンがクリックされた場合、一覧画面に戻る
        const currentPage = window.location.pathname;

        if (currentPage.includes("/memo/") && this.id === "btn-memo") {
          // MEMOページでMEMOボタンがクリックされた場合
          // 保存された状態を取得
          const savedState = PageStateManager.getPageState("memo");

          // 編集画面からの遷移時は保存確認を行う
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (
            isEditMode &&
            typeof window.checkForUnsavedMemoChanges === "function"
          ) {
            // 編集中のメモデータを取得
            const memoId = window.getCurrentEditingMemoId
              ? window.getCurrentEditingMemoId()
              : null;

            if (window.memos && memoId !== null) {
              const originalMemo =
                memoId !== undefined
                  ? window.memos.find((m) => m.id === memoId)
                  : null;
              const hasChanges = window.checkForUnsavedMemoChanges(
                originalMemo,
                memoId === undefined
              );

              if (hasChanges) {
                // 変更がある場合は保存確認ダイアログを表示
                if (
                  typeof window.AppUtils?.showSaveConfirmDialog === "function"
                ) {
                  window.AppUtils.showSaveConfirmDialog({
                    title: "変更を保存しますか？",
                    message:
                      "メモ内容に変更があります。<br>保存せずに戻ると変更が失われます。",
                    onSave: async () => {
                      // 保存してから保存された状態に戻る
                      const titleInput = document.querySelector(".title-input");
                      const textInput = document.querySelector(".text-input");
                      const starInput = document.querySelector(".star-input");

                      if (titleInput && textInput && starInput) {
                        const title = titleInput.value.trim() || "無題";
                        const body = textInput.value.trim();
                        const starred = starInput.dataset.starred === "true";

                        if (memoId !== undefined && memoId !== null) {
                          // update existing
                          const idx = window.memos.findIndex(
                            (m) => m.id === memoId
                          );
                          if (idx !== -1) {
                            window.memos[idx] = {
                              id: memoId,
                              title,
                              content: body,
                              starred,
                            };
                            console.log(
                              "[MEMO NAV] 変更を保存して状態を復元しました"
                            );
                          }
                        } else {
                          // add new
                          const newM = {
                            id: Date.now(),
                            title,
                            content: body,
                            starred,
                            archived: false,
                          };
                          window.memos.push(newM);
                          console.log(
                            "[MEMO NAV] 新規メモを保存して状態を復元しました"
                          );
                        }

                        // 保存してから保存された状態に遷移
                        if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "memos",
                            window.memos
                          );
                        } else if (typeof window.saveStorage === "function") {
                          await window.saveStorage("memos", window.memos);
                        }

                        // 保存された状態に遷移
                        restoreMemoPageState(savedState);
                      } else {
                        // 保存された状態に遷移
                        restoreMemoPageState(savedState);
                      }
                    },
                    onDiscard: () => {
                      // 破棄して保存された状態に戻る
                      console.log(
                        "[MEMO NAV] 変更を破棄して状態を復元しました"
                      );
                      restoreMemoPageState(savedState);
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }

          // 変更がない場合は保存された状態に戻る
          restoreMemoPageState(savedState);
        } else if (
          currentPage.includes("/prompt/") &&
          this.id === "btn-prompt"
        ) {
          // PROMPTページでPROMPTボタンがクリックされた場合
          // 保存された状態を取得
          const savedState = PageStateManager.getPageState("prompt");

          // 編集画面からの遷移時は保存確認を行う
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (
            isEditMode &&
            typeof window.checkForUnsavedChanges === "function"
          ) {
            // 編集中のプロンプトデータを取得
            const promptIndex = window.getCurrentPromptIndex
              ? window.getCurrentPromptIndex()
              : -1;

            if (
              promptIndex >= 0 &&
              window.prompts &&
              window.prompts[promptIndex]
            ) {
              const hasChanges = window.checkForUnsavedChanges(
                window.prompts[promptIndex],
                false
              );

              if (hasChanges) {
                // 変更がある場合は保存確認ダイアログを表示
                if (
                  typeof window.AppUtils?.showSaveConfirmDialog === "function"
                ) {
                  window.AppUtils.showSaveConfirmDialog({
                    title: "変更を保存しますか？",
                    message:
                      "プロンプト内容に変更があります。<br>保存せずに戻ると変更が失われます。",
                    onSave: async () => {
                      // 保存してから保存された状態に戻る
                      const obj = window.prompts[promptIndex];
                      const titleInput = document.querySelector(".title-input");
                      const wrap = document.querySelector("#field-wrap");

                      if (titleInput && wrap) {
                        obj.title = titleInput.value.trim() || "(無題)";
                        obj.fields = [...wrap.children].map((w) => ({
                          text: w.querySelector(".prompt-field-textarea").value,
                          on: w.querySelector(".field-toggle").checked,
                        }));

                        // 保存してから保存された状態に遷移
                        if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "prompts",
                            window.prompts
                          );
                        } else if (typeof window.save === "function") {
                          await window.save("prompts", window.prompts);
                        }

                        console.log(
                          "[PROMPT NAV] 変更を保存して状態を復元しました"
                        );
                        // フォームヘッダーを削除
                        document.querySelector(".form-header")?.remove();
                        // 保存された状態に遷移
                        restorePromptPageState(savedState);
                      } else {
                        // 保存された状態に遷移
                        restorePromptPageState(savedState);
                      }
                    },
                    onDiscard: () => {
                      // 破棄して保存された状態に戻る
                      console.log(
                        "[PROMPT NAV] 変更を破棄して状態を復元しました"
                      );
                      // フォームヘッダーを削除
                      document.querySelector(".form-header")?.remove();
                      // 保存された状態に遷移
                      restorePromptPageState(savedState);
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }

          // 変更がない場合は保存された状態に戻る
          restorePromptPageState(savedState);
        } else if (
          currentPage.includes("/clipboard/") &&
          this.id === "btn-clipboard"
        ) {
          // CLIPBOARDページでCLIPBOARDボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("clipboard");
          restoreClipboardPageState(savedState);
        } else if (currentPage.includes("/ai/") && this.id === "btn-ai") {
          // AIページでAIボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("ai");
          restoreAIPageState(savedState);
        } else if (
          currentPage.includes("/setting/") &&
          this.id === "btn-setting"
        ) {
          // 設定ページで設定ボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("setting");
          restoreSettingPageState(savedState);
        }
      } else {
        // 他のページへの遷移の場合、編集画面からの遷移時は保存確認
        const currentPage = window.location.pathname;

        // PROMPTページの編集画面からの遷移
        if (currentPage.includes("/prompt/")) {
          // PROMPTページの編集画面かチェック（より確実な判定）
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          const hasFormHeader = document.querySelector(".form-header");
          const hasTitleInput = document.querySelector(".title-input");
          const hasFieldWrap = document.querySelector("#field-wrap");

          console.log("[DEBUG] PROMPT編集画面判定:", {
            isEditMode: !!isEditMode,
            hasFormHeader: !!hasFormHeader,
            hasTitleInput: !!hasTitleInput,
            hasFieldWrap: !!hasFieldWrap,
            checkForUnsavedChanges:
              typeof window.checkForUnsavedChanges === "function",
            windowPrompts: !!window.prompts,
            windowPromptsLength: window.prompts ? window.prompts.length : 0,
          });

          // 編集画面の判定条件を緩和する
          if (
            isEditMode &&
            hasTitleInput &&
            hasFieldWrap &&
            typeof window.checkForUnsavedChanges === "function"
          ) {
            // 編集中のプロンプトデータを取得
            const promptIndex = window.getCurrentPromptIndex
              ? window.getCurrentPromptIndex()
              : -1;

            console.log("[DEBUG] promptIndex:", promptIndex);
            console.log("[DEBUG] window.prompts:", window.prompts);

            // 新規作成または既存編集の判定
            let originalObj = null;
            let isNew = true;

            if (
              promptIndex >= 0 &&
              window.prompts &&
              window.prompts[promptIndex]
            ) {
              // 既存編集の場合
              originalObj = window.prompts[promptIndex];
              isNew = false;
              console.log("[DEBUG] 既存編集モード:", originalObj);
            } else {
              // 新規作成の場合
              console.log("[DEBUG] 新規作成モード");
            }

            const hasChanges = window.checkForUnsavedChanges(
              originalObj,
              isNew
            );

            console.log("[DEBUG] hasChanges:", hasChanges);

            if (hasChanges) {
              e.preventDefault(); // ページ遷移を一時停止
              console.log("[DEBUG] 保存確認ダイアログを表示します");

              // 保存確認ダイアログを表示
              if (
                typeof window.AppUtils?.showSaveConfirmDialog === "function"
              ) {
                window.AppUtils.showSaveConfirmDialog({
                  title: "変更を保存しますか？",
                  message:
                    "プロンプト内容に変更があります。<br>保存せずに移動すると変更が失われます。",
                  onSave: async () => {
                    try {
                      console.log("[NAV] 保存処理を開始します");

                      // プロンプト配列の初期化確認
                      if (!window.prompts) {
                        window.prompts = [];
                      }

                      const titleInput = document.querySelector(".title-input");
                      const wrap = document.querySelector("#field-wrap");

                      if (titleInput && wrap) {
                        let obj;

                        if (isNew) {
                          // 新規作成の場合は新しいオブジェクトを作成
                          obj = {
                            id: Date.now(),
                            title: titleInput.value.trim() || "(無題)",
                            fields: [],
                            archived: false,
                          };
                          window.prompts.push(obj);
                          console.log("[NAV] 新規プロンプトを作成:", obj);
                        } else {
                          // 既存編集の場合
                          obj = window.prompts[promptIndex];
                          if (!obj) {
                            console.error(
                              "[NAV] 既存プロンプトが見つかりません"
                            );
                            window.location.href = this.href;
                            return;
                          }
                          obj.title = titleInput.value.trim() || "(無題)";
                          console.log("[NAV] 既存プロンプトを更新:", obj);
                        }

                        // フィールドデータを更新
                        obj.fields = [...wrap.children].map((w) => ({
                          text:
                            w.querySelector(".prompt-field-textarea")?.value ||
                            "",
                          on:
                            w.querySelector(".field-toggle")?.checked || false,
                        }));

                        // 保存してからページ遷移
                        if (typeof window.save === "function") {
                          await window.save("prompts", window.prompts);
                          console.log("[NAV] window.saveで保存成功");
                        } else if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "prompts",
                            window.prompts
                          );
                          console.log("[NAV] AppUtils.saveStorageで保存成功");
                        } else {
                          // Fallback保存
                          chrome.storage.local.set(
                            { prompts: window.prompts },
                            () => {
                              if (chrome.runtime.lastError) {
                                console.error(
                                  "[NAV] Fallback保存に失敗:",
                                  chrome.runtime.lastError
                                );
                              } else {
                                console.log("[NAV] Fallback保存成功");
                              }
                            }
                          );
                        }

                        console.log("[NAV] 変更を保存してページ遷移しました");
                      } else {
                        console.error("[NAV] 必要な要素が見つかりません");
                      }

                      // フォームヘッダーを削除
                      document.querySelector(".form-header")?.remove();
                      // ページ遷移を実行
                      window.location.href = this.href;
                    } catch (error) {
                      console.error("[NAV] 保存中にエラーが発生:", error);
                      // エラーが発生してもページ遷移は実行
                      document.querySelector(".form-header")?.remove();
                      window.location.href = this.href;
                    }
                  },
                  onDiscard: () => {
                    // 破棄してページ遷移
                    console.log("[NAV] 変更を破棄してページ遷移しました");
                    // フォームヘッダーを削除
                    document.querySelector(".form-header")?.remove();
                    // ページ遷移を実行
                    window.location.href = this.href;
                  },
                });
                return; // ここで処理を終了
              } else {
                // AppUtilsが利用できない場合のFallback処理
                const confirmResult = confirm(
                  "プロンプト内容に変更があります。保存せずに移動しますか？"
                );
                if (confirmResult) {
                  console.log("[NAV] Fallback: 変更を破棄してページ遷移");
                  document.querySelector(".form-header")?.remove();
                  window.location.href = this.href;
                } else {
                  console.log(
                    "[NAV] Fallback: ユーザーがページ遷移をキャンセル"
                  );
                }
                return;
              }
            }
          }
        }

        // MEMOページの編集画面からの遷移
        if (currentPage.includes("/memo/")) {
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (
            isEditMode &&
            typeof window.checkForUnsavedMemoChanges === "function"
          ) {
            // 編集中のメモデータを取得
            const memoId = window.getCurrentEditingMemoId
              ? window.getCurrentEditingMemoId()
              : null;

            if (window.memos && memoId !== null) {
              const originalMemo =
                memoId !== undefined
                  ? window.memos.find((m) => m.id === memoId)
                  : null;
              const hasChanges = window.checkForUnsavedMemoChanges(
                originalMemo,
                memoId === undefined
              );

              if (hasChanges) {
                e.preventDefault(); // ページ遷移を一時停止

                // 変更がある場合は保存確認ダイアログを表示
                if (
                  typeof window.AppUtils?.showSaveConfirmDialog === "function"
                ) {
                  window.AppUtils.showSaveConfirmDialog({
                    title: "変更を保存しますか？",
                    message:
                      "メモ内容に変更があります。<br>保存せずに移動すると変更が失われます。",
                    onSave: async () => {
                      // 保存してからページ遷移
                      const titleInput = document.querySelector(".title-input");
                      const textInput = document.querySelector(".text-input");
                      const starInput = document.querySelector(".star-input");

                      if (titleInput && textInput && starInput) {
                        const title = titleInput.value.trim() || "無題";
                        const body = textInput.value.trim();
                        const starred = starInput.dataset.starred === "true";

                        if (memoId !== undefined && memoId !== null) {
                          // update existing
                          const idx = window.memos.findIndex(
                            (m) => m.id === memoId
                          );
                          if (idx !== -1) {
                            window.memos[idx] = {
                              id: memoId,
                              title,
                              content: body,
                              starred,
                            };
                            console.log(
                              "[MEMO NAV] 変更を保存してページ遷移しました"
                            );
                          }
                        } else {
                          // add new
                          const newM = {
                            id: Date.now(),
                            title,
                            content: body,
                            starred,
                            archived: false,
                          };
                          window.memos.push(newM);
                          console.log(
                            "[MEMO NAV] 新規メモを保存してページ遷移しました"
                          );
                        }

                        // 保存してからページ遷移
                        if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "memos",
                            window.memos
                          );
                        } else if (typeof window.saveStorage === "function") {
                          await window.saveStorage("memos", window.memos);
                        }

                        // ページ遷移を実行
                        window.location.href = this.href;
                      } else {
                        // ページ遷移を実行
                        window.location.href = this.href;
                      }
                    },
                    onDiscard: () => {
                      // 破棄してページ遷移
                      console.log(
                        "[MEMO NAV] 変更を破棄してページ遷移しました"
                      );
                      // ページ遷移を実行
                      window.location.href = this.href;
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }
        }
      }

      // 展開状態のクラスを追加
      this.classList.add("expanded");

      // data-click-tooltip属性がある場合（AI専用メッセージ）
      if (this.hasAttribute("data-click-tooltip")) {
        this.classList.add("clicked");
      }

      // 2秒後にクラスを削除
      setTimeout(() => {
        this.classList.remove("expanded");
        this.classList.remove("clicked");
      }, 2000);
    });
  });
});
