// File: pages/common.js
// ナビゲーションボタンのクリック時展開機能

document.addEventListener("DOMContentLoaded", function () {
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
                      // 保存してから一覧画面に戻る
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
                              "[MEMO NAV] 変更を保存して一覧画面に戻りました"
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
                            "[MEMO NAV] 新規メモを保存して一覧画面に戻りました"
                          );
                        }

                        // 保存してから一覧画面に遷移
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

                        // 一覧画面に遷移
                        if (typeof window.renderListView === "function") {
                          window.renderListView();
                        } else if (typeof renderListView === "function") {
                          renderListView();
                        }
                      } else {
                        // 一覧画面に遷移
                        if (typeof window.renderListView === "function") {
                          window.renderListView();
                        } else if (typeof renderListView === "function") {
                          renderListView();
                        }
                      }
                    },
                    onDiscard: () => {
                      // 破棄して一覧画面に戻る
                      console.log(
                        "[MEMO NAV] 変更を破棄して一覧画面に戻りました"
                      );
                      // 一覧画面に遷移
                      if (typeof window.renderListView === "function") {
                        window.renderListView();
                      } else if (typeof renderListView === "function") {
                        renderListView();
                      }
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }

          // 変更がない場合は通常通り一覧画面に戻る
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        } else if (
          currentPage.includes("/prompt/") &&
          this.id === "btn-prompt"
        ) {
          // PROMPTページでPROMPTボタンがクリックされた場合
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
                      // 保存してから一覧画面に戻る
                      const obj = window.prompts[promptIndex];
                      const titleInput = document.querySelector(".title-input");
                      const wrap = document.querySelector("#field-wrap");

                      if (titleInput && wrap) {
                        obj.title = titleInput.value.trim() || "(無題)";
                        obj.fields = [...wrap.children].map((w) => ({
                          text: w.querySelector(".prompt-field-textarea").value,
                          on: w.querySelector(".field-toggle").checked,
                        }));

                        // 保存してから一覧画面に遷移
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
                          "[PROMPT NAV] 変更を保存して一覧画面に戻りました"
                        );
                        // フォームヘッダーを削除
                        document.querySelector(".form-header")?.remove();
                        // 一覧画面に遷移
                        if (typeof window.renderList === "function") {
                          window.renderList();
                        } else if (typeof renderList === "function") {
                          renderList();
                        }
                      } else {
                        // 一覧画面に遷移
                        if (typeof window.renderList === "function") {
                          window.renderList();
                        } else if (typeof renderList === "function") {
                          renderList();
                        }
                      }
                    },
                    onDiscard: () => {
                      // 破棄して一覧画面に戻る
                      console.log(
                        "[PROMPT NAV] 変更を破棄して一覧画面に戻りました"
                      );
                      // フォームヘッダーを削除
                      document.querySelector(".form-header")?.remove();
                      // 一覧画面に遷移
                      if (typeof window.renderList === "function") {
                        window.renderList();
                      } else if (typeof renderList === "function") {
                        renderList();
                      }
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }

          // 変更がない場合は通常通り一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        } else if (
          currentPage.includes("/clipboard/") &&
          this.id === "btn-clipboard"
        ) {
          // CLIPBOARDページでCLIPBOARDボタンがクリックされた場合
          if (typeof window.renderClipboardView === "function") {
            window.renderClipboardView();
          } else if (typeof renderClipboardView === "function") {
            renderClipboardView();
          }
        } else if (currentPage.includes("/ai/") && this.id === "btn-ai") {
          // AIページでAIボタンがクリックされた場合
          if (typeof window.renderAIMain === "function") {
            window.renderAIMain();
          } else if (typeof renderAIMain === "function") {
            renderAIMain();
          }
        } else if (
          currentPage.includes("/setting/") &&
          this.id === "btn-setting"
        ) {
          // 設定ページで設定ボタンがクリックされた場合
          if (typeof window.renderSettingMain === "function") {
            window.renderSettingMain();
          } else if (typeof renderSettingMain === "function") {
            renderSettingMain();
          }
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
          });

          // 編集画面の判定条件を厳密にする
          if (
            isEditMode &&
            hasFormHeader &&
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

            // プロンプトデータが存在し、編集画面で有効なインデックスがある場合
            if (
              promptIndex >= 0 &&
              window.prompts &&
              window.prompts[promptIndex]
            ) {
              // 新規作成かどうかを判定（フォームヘッダーのテキストで判断）
              const formHeaderText = hasFormHeader.textContent || "";
              const isNew =
                formHeaderText.includes("新規") ||
                promptIndex === window.prompts.length - 1;

              const hasChanges = window.checkForUnsavedChanges(
                window.prompts[promptIndex],
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
                      // 保存してからページ遷移
                      const obj = window.prompts[promptIndex];
                      const titleInput = document.querySelector(".title-input");
                      const wrap = document.querySelector("#field-wrap");

                      if (titleInput && wrap) {
                        obj.title = titleInput.value.trim() || "(無題)";
                        obj.fields = [...wrap.children].map((w) => ({
                          text: w.querySelector(".prompt-field-textarea").value,
                          on: w.querySelector(".field-toggle").checked,
                        }));

                        // 保存してからページ遷移
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

                        console.log("[NAV] 変更を保存してページ遷移しました");
                        // フォームヘッダーを削除
                        document.querySelector(".form-header")?.remove();
                        // ページ遷移を実行
                        window.location.href = this.href;
                      } else {
                        // ページ遷移を実行
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
                }
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
