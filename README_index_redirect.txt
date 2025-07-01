このChrome拡張は index.html を default_popup に指定し、index.js で localStorage の activePage を参照して各ページに自動リダイレクトします。

- 初回起動時（activePageが未設定）は MEMOページ（memo.html）が開きます。
- 2回目以降は、最後に開いていたページ（activePage）に自動で遷移します。
- 許可されていないページ名の場合も安全にmemo.htmlに遷移します。
 
manifest.json の default_popup は index.html です。 