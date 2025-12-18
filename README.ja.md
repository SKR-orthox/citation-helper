# README.ja.md (日本語)

Citation Helper は、対応している論文/章ページからメタデータを抽出し、参考文献形式に整形してコピーできる Firefox 拡張機能です。

対応サイト
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)
  - /article/ と /chapter/ に対応

対応フォーマット
- Vancouver
- APA 第7版
- IEEE
- BibTeX
  - SpringerLink の chapter は @incollection と booktitle で出力されます。

使い方
- 対応している論文ページを開きます
- 拡張機能アイコンを押します
- Fetch citation を押します
- 形式を選び、Copy でコピーします

ローカル処理
- 現在ページの meta タグ等から抽出し、整形処理はローカルで行います。

開発/テスト
- Node.js が必要です。
- 依存関係のインストール:
  - npm install

テスト
- npm test

スナップショット更新(出力変更が意図的な場合)
- node ./run-formatters.cjs --update
  - package.json scripts に追加すると便利です
    - "test:update": "node ./run-formatters.cjs --update"

デバッグ lastCitationData の保存
- 拡張の DevTools コンソールで debugMode を有効化します
  - about:debugging#/runtime/this-firefox
  - 拡張機能の Inspect をクリック
  - 実行:
    - browser.storage.local.set({ debugMode: true })
- 対応ページで Fetch citation を実行後、以下で確認できます
  - browser.storage.local.get(["lastCitationUrl","lastCitationAt","lastCitationData"]).then(console.log)

バージョン方針
- v0.8.x: 機能追加と export 拡張(ストアベータと分離)
- v0.9.0-beta: ストアベータ、パッケージング、ストアQA安定化
- v1.0.0: 最初の正式版

ライセンス
- 後で決定