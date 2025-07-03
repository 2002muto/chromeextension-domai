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
      // ドラッグ中の場合はクリックイベントを無効化
      if (window.isDraggingNavigation) {
        console.log("[Navigation] ドラッグ中のためクリックイベントを無効化");
        e.preventDefault();
        e.stopPropagation();
        return;
      }

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

// ━━━━━━━━━━ ヘッダーナビゲーションのドラッグ＆ドロップ機能 ━━━━━━━━━━

// ドラッグ状態を追跡するグローバル変数
window.isDraggingNavigation = false;

// ナビゲーション順序の管理
const NavigationOrderManager = {
  // デフォルト順序
  defaultOrder: [
    "btn-memo-list",
    "btn-clipboard",
    "btn-prompt",
    "btn-iframe",
    "btn-ai",
    "btn-status",
    "btn-setting",
  ],

  // 保存された順序を取得
  getSavedOrder: () => {
    try {
      const saved = localStorage.getItem("navOrder");
      return saved ? JSON.parse(saved) : NavigationOrderManager.defaultOrder;
    } catch (error) {
      console.error("[NavigationOrder] 順序取得エラー:", error);
      return NavigationOrderManager.defaultOrder;
    }
  },

  // 順序を保存
  saveOrder: (order) => {
    try {
      localStorage.setItem("navOrder", JSON.stringify(order));
      console.log("[NavigationOrder] 順序を保存:", order);
    } catch (error) {
      console.error("[NavigationOrder] 順序保存エラー:", error);
    }
  },

  // ヘッダーを再構築
  rebuildHeader: () => {
    const header = document.querySelector("header");
    if (!header) {
      console.log("[NavigationOrder] ヘッダー要素が見つかりません");
      return;
    }

    const savedOrder = NavigationOrderManager.getSavedOrder();
    const currentButtons = Array.from(header.children);

    console.log("[NavigationOrder] 保存された順序:", savedOrder);
    console.log(
      "[NavigationOrder] 現在のボタン:",
      currentButtons.map((btn) => btn.id)
    );

    // 保存された順序で並び替え
    savedOrder.forEach((btnId) => {
      const button = currentButtons.find((btn) => btn.id === btnId);
      if (button) {
        header.appendChild(button);
      }
    });

    // CSSのorderプロパティを完全に無効化してDOM順序のみで制御
    savedOrder.forEach((btnId, index) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.order = "";
      }
    });

    console.log("[NavigationOrder] ヘッダー再構築完了");
  },
};

// ドラッグ＆ドロップ機能の初期化
function initializeHeaderDragAndDrop() {
  const header = document.querySelector("header");
  if (!header) {
    console.log("[DragDrop] ヘッダー要素が見つかりません");
    return;
  }

  console.log("[DragDrop] ヘッダードラッグ＆ドロップ機能を初期化中...");

  // 各ナビゲーションボタンにドラッグ機能を追加
  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(
    "[DragDrop] 見つかったナビゲーションボタン数:",
    navButtons.length
  );

  navButtons.forEach((button, index) => {
    console.log(`[DragDrop] ボタン${index + 1}:`, button.id, button);

    // 長押し検出用の変数
    let holdTimer = null;
    let isHolding = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;

    // 初期状態ではドラッグ不可
    button.draggable = false;
    button.dataset.index = index;

    // マウスダウン（長押し開始）
    button.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // 左クリックのみ
        console.log("[DragDrop] mousedown:", button.id);

        startX = e.clientX;
        startY = e.clientY;
        hasMoved = false;

        // 長押しタイマー開始（500ms）
        holdTimer = setTimeout(() => {
          console.log("[DragDrop] 長押し検出:", button.id);
          isHolding = true;
          button.draggable = true;
          button.classList.add("holding");

          // 視覚的フィードバック
          button.style.transform = "scale(0.95)";
          button.style.opacity = "0.8";
        }, 500);
      }
    });

    // マウス移動（ドラッグ開始判定）
    button.addEventListener("mousemove", (e) => {
      if (holdTimer && !isHolding) {
        const moveX = Math.abs(e.clientX - startX);
        const moveY = Math.abs(e.clientY - startY);

        // 5px以上移動したら長押しをキャンセル
        if (moveX > 5 || moveY > 5) {
          console.log("[DragDrop] 移動検出、長押しキャンセル:", button.id);
          clearTimeout(holdTimer);
          holdTimer = null;
          hasMoved = true;
        }
      }
    });

    // マウスアップ（長押し終了）
    button.addEventListener("mouseup", (e) => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      if (isHolding) {
        console.log("[DragDrop] 長押し終了:", button.id);
        isHolding = false;
        button.draggable = false;
        button.classList.remove("holding");

        // 視覚的フィードバックをリセット
        button.style.transform = "";
        button.style.opacity = "";
      }
    });

    // マウスリーブ（長押しキャンセル）
    button.addEventListener("mouseleave", () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      if (isHolding) {
        isHolding = false;
        button.draggable = false;
        button.classList.remove("holding");
        button.style.transform = "";
        button.style.opacity = "";
      }
    });

    // クリックイベントとの競合を避ける
    button.addEventListener("click", (e) => {
      if (isHolding || hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        console.log("[DragDrop] 長押し中のクリックを無効化:", button.id);
        return false;
      }
    });

    // リンク要素のドラッグを有効にする
    if (button.tagName === "A") {
      button.addEventListener(
        "dragstart",
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );
    }

    // ドラッグ開始
    button.addEventListener("dragstart", (e) => {
      console.log("[DragDrop] dragstart:", button.id);
      e.dataTransfer.setData("text/plain", button.id);
      e.dataTransfer.effectAllowed = "move";
      button.classList.add("dragging");
      button.classList.remove("holding");
    });

    // ドラッグ終了
    button.addEventListener("dragend", () => {
      console.log("[DragDrop] dragend:", button.id);
      button.classList.remove("dragging");
      button.draggable = false; // ドラッグを無効化

      // 視覚的フィードバックをリセット
      button.style.transform = "";
      button.style.opacity = "";

      // すべてのボタンのドラッグオーバー状態をクリア
      const allButtons = document.querySelectorAll("header .nav-btn");
      allButtons.forEach((btn) => {
        btn.classList.remove("drag-over");
      });
    });

    // ドラッグオーバー
    button.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // ドラッグ中のボタン自身にはドロップオーバー効果を適用しない
      if (!button.classList.contains("dragging")) {
        button.classList.add("drag-over");
      }
    });

    // ドラッグリーブ
    button.addEventListener("dragleave", (e) => {
      // 子要素にドラッグが入った場合はリーブしない
      if (e.relatedTarget && button.contains(e.relatedTarget)) {
        return;
      }
      button.classList.remove("drag-over");
    });

    // ドロップ
    button.addEventListener("drop", (e) => {
      console.log("[DragDrop] drop:", button.id);
      e.preventDefault();
      button.classList.remove("drag-over");

      const draggedId = e.dataTransfer.getData("text/plain");
      const draggedButton = document.getElementById(draggedId);

      if (draggedButton && draggedButton !== button) {
        // 実際のDOM要素の位置を変更
        const header = document.querySelector("header");

        // ドラッグされた要素を削除して新しい位置に挿入
        draggedButton.remove();
        header.insertBefore(draggedButton, button);

        // 新しい順序を取得して保存
        const newOrder = Array.from(header.children).map((btn) => btn.id);
        NavigationOrderManager.saveOrder(newOrder);

        console.log("[DragDrop] 移動後のDOM順序:", newOrder);

        // 成功メッセージを表示
        showNavigationDragDropSuccessMessage(draggedId, button.id);
      }
    });
  });

  console.log("[DragDrop] ヘッダードラッグ＆ドロップ機能の初期化完了");
}

// ナビゲーションドラッグ＆ドロップ成功メッセージ
function showNavigationDragDropSuccessMessage(fromId, toId) {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".nav-drag-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "nav-drag-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    <span>ナビゲーション順序を変更しました</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 2000);
}

// ページ読み込み時にナビゲーション機能を初期化
document.addEventListener("DOMContentLoaded", () => {
  console.log("[NavigationOrder] DOMContentLoaded - ナビゲーション機能初期化");

  // 少し遅延してから初期化（他のスクリプトの読み込みを待つ）
  setTimeout(() => {
    // 保存された順序でヘッダーを再構築
    NavigationOrderManager.rebuildHeader();

    // ドラッグ＆ドロップ機能を初期化
    initializeHeaderDragAndDrop();
  }, 100);
});

// ページ読み込み完了後にも初期化を試行
window.addEventListener("load", () => {
  console.log(
    "[NavigationOrder] load - ナビゲーション機能初期化（フォールバック）"
  );

  // まだ初期化されていない場合のみ実行
  if (!document.querySelector("header .nav-btn[draggable]")) {
    setTimeout(() => {
      NavigationOrderManager.rebuildHeader();
      initializeHeaderDragAndDrop();
    }, 50);
  }
});

// グローバルに公開
window.NavigationOrderManager = NavigationOrderManager;
window.initializeHeaderDragAndDrop = initializeHeaderDragAndDrop;
window.showNavigationDragDropSuccessMessage =
  showNavigationDragDropSuccessMessage;

// デバッグ用のテスト関数
window.testNavigationDragDrop = () => {
  console.log("[TEST] ナビゲーションドラッグ＆ドロップテスト開始");
  console.log("[TEST] ヘッダー要素:", document.querySelector("header"));
  console.log(
    "[TEST] ナビゲーションボタン:",
    document.querySelectorAll("header .nav-btn")
  );
  console.log(
    "[TEST] ドラッグ可能なボタン:",
    document.querySelectorAll("header .nav-btn[draggable]")
  );
  console.log("[TEST] 保存された順序:", NavigationOrderManager.getSavedOrder());

  // 各ボタンの詳細情報を表示
  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    console.log(`[TEST] ボタン${index + 1}:`, {
      id: btn.id,
      draggable: btn.draggable,
      className: btn.className,
      textContent: btn.textContent.trim(),
      href: btn.href,
      cursor: btn.style.cursor,
      isDragging: btn.classList.contains("dragging"),
      isHolding: btn.classList.contains("holding"),
    });
  });
};

// ドラッグ状態を強制的にリセットする関数
window.resetDragState = () => {
  console.log("[TEST] ドラッグ状態をリセット");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn) => {
    btn.draggable = false; // 初期状態ではドラッグ不可
    btn.classList.remove("dragging", "drag-over", "holding");
    btn.style.cursor = "";
    btn.style.transform = "";
    btn.style.opacity = "";
  });

  console.log("[TEST] ドラッグ状態リセット完了");
};

// ドラッグテスト関数
window.testDrag = () => {
  console.log("[TEST] ドラッグテスト開始");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    console.log(`[TEST] ボタン${index + 1}:`, {
      id: btn.id,
      tagName: btn.tagName,
      draggable: btn.draggable,
      href: btn.href,
      className: btn.className,
      style: {
        cursor: btn.style.cursor,
        userDrag: btn.style.webkitUserDrag || btn.style.userDrag,
      },
    });
  });

  // 最初のボタンでドラッグテスト
  if (buttons.length > 0) {
    const firstButton = buttons[0];
    console.log("[TEST] 最初のボタンでドラッグテスト:", firstButton.id);

    // 手動でドラッグ開始イベントを発火
    const dragStartEvent = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });

    firstButton.dispatchEvent(dragStartEvent);
  }
};

// 手動でDOM操作をテストする関数
window.testDOMManipulation = () => {
  console.log("[TEST] DOM操作テスト開始");

  const header = document.querySelector("header");
  const buttons = Array.from(header.children);

  if (buttons.length >= 2) {
    const firstButton = buttons[0];
    const secondButton = buttons[1];

    console.log(
      "[TEST] 移動前:",
      buttons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 移動前のorder値:",
      buttons.map((btn) => btn.style.order)
    );

    // 最初のボタンを最後に移動
    firstButton.remove();
    header.appendChild(firstButton);

    const newButtons = Array.from(header.children);
    console.log(
      "[TEST] 移動後:",
      newButtons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 移動後のorder値:",
      newButtons.map((btn) => btn.style.order)
    );

    // 元に戻す
    firstButton.remove();
    header.insertBefore(firstButton, secondButton);

    const finalButtons = Array.from(header.children);
    console.log(
      "[TEST] 元に戻した後:",
      finalButtons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 元に戻した後のorder値:",
      finalButtons.map((btn) => btn.style.order)
    );
  }
};

// CSSのorderプロパティを確認する関数
window.checkOrderProperties = () => {
  console.log("[TEST] CSS orderプロパティ確認");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    const computedStyle = window.getComputedStyle(btn);
    console.log(`[TEST] ${btn.id}:`, {
      computedOrder: computedStyle.order,
      inlineOrder: btn.style.order,
      index: index,
      parent: btn.parentElement?.tagName,
      nextSibling: btn.nextElementSibling?.id,
      previousSibling: btn.previousElementSibling?.id,
    });
  });
};

// 強制的にorderプロパティをリセットする関数
window.resetOrderProperties = () => {
  console.log("[TEST] orderプロパティをリセット");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    btn.style.order = "";
    console.log(`[TEST] ${btn.id}のorderをリセット`);
  });

  // デフォルト順序で再設定
  const defaultOrder = [
    "btn-memo-list",
    "btn-clipboard",
    "btn-prompt",
    "btn-iframe",
    "btn-ai",
    "btn-status",
    "btn-setting",
  ];

  defaultOrder.forEach((btnId, index) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.style.order = index + 1;
      console.log(`[TEST] ${btnId}のorderを${index + 1}に設定`);
    }
  });
};

// 手動でドラッグ＆ドロップ機能を再初期化する関数
window.reinitializeDragDrop = () => {
  console.log("[TEST] ドラッグ＆ドロップ機能を再初期化");
  initializeHeaderDragAndDrop();
};

// 手動でボタンの順序を変更するテスト関数
window.testManualReorder = () => {
  console.log("[TEST] 手動でボタン順序を変更");

  const header = document.querySelector("header");
  const buttons = Array.from(header.children);

  if (buttons.length >= 2) {
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    console.log(
      "[TEST] 変更前:",
      buttons.map((btn) => btn.id)
    );

    // 最初のボタンを最後に移動
    firstButton.remove();
    header.appendChild(firstButton);

    // ヘッダーのdisplayを一時的に変更
    header.style.display = "block";
    setTimeout(() => {
      header.style.display = "flex";
      console.log(
        "[TEST] 変更後:",
        Array.from(header.children).map((btn) => btn.id)
      );
    }, 100);
  }
};

console.log("[NavigationOrder] ナビゲーション機能が読み込まれました");
console.log("[NavigationOrder] テスト用コマンド:");
console.log("  - window.testNavigationDragDrop() - 基本情報確認");
console.log("  - window.resetDragState() - ドラッグ状態リセット");
console.log("  - window.testDrag() - ドラッグテスト");
console.log("  - window.testDOMManipulation() - DOM操作テスト");
console.log("  - window.checkOrderProperties() - CSS order確認");
console.log("  - window.resetOrderProperties() - orderプロパティリセット");
console.log("  - window.testManualReorder() - 手動順序変更テスト");
console.log("  - window.reinitializeDragDrop() - 機能再初期化");

// ページ読み込み時にアイコン表示設定を適用
document.addEventListener("DOMContentLoaded", () => {
  console.log("COMMON: DOMContentLoaded - アイコン表示設定を適用");
  applyIconVisibilityFromStorage();
});

// ストレージからアイコン表示設定を適用
function applyIconVisibilityFromStorage() {
  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings;
    if (settings && settings.selectedIcons) {
      applyIconVisibility(settings.selectedIcons);
      console.log("アイコン表示設定を適用:", settings.selectedIcons);
    }
  });
}

// アイコン表示の適用（common.js版）
function applyIconVisibility(selectedIcons) {
  const header = document.querySelector("header");
  if (!header) {
    console.log("COMMON: ヘッダーが見つかりません");
    return;
  }

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(`COMMON: ヘッダー内のボタン数: ${navButtons.length}`);

  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    // 設定アイコンは常に表示
    if (iconType === "setting") {
      button.style.display = "flex";
      console.log(`COMMON: ${buttonId} (${iconType}): 表示 (設定アイコン)`);
    } else if (selectedIcons.includes(iconType)) {
      button.style.display = "flex";
      console.log(`COMMON: ${buttonId} (${iconType}): 表示 (選択済み)`);
    } else {
      button.style.display = "none";
      console.log(`COMMON: ${buttonId} (${iconType}): 非表示 (未選択)`);
    }
  });

  console.log("COMMON: ヘッダー更新完了 - 表示アイコン:", selectedIcons);
}

// ボタンIDからアイコンタイプを取得（common.js版）
function getIconTypeFromId(buttonId) {
  const iconMap = {
    "btn-memo-list": "memo",
    "btn-clipboard": "clipboard",
    "btn-prompt": "prompt",
    "btn-iframe": "iframe",
    "btn-ai": "ai",
    "btn-status": "status",
    "btn-setting": "setting",
  };

  return iconMap[buttonId] || buttonId;
}
