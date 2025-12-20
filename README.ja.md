# README.ja.md (日本語)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md)

# Citation Helper

Citation Helperは、対応する論文/チャプターのページから引用メタデータを抽出し、複数形式の参考文献文字列を生成してコピーできるFirefox拡張です。

現在のバージョン
- v0.8.3

対応サイト
- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)
  - /article/
  - /chapter/

対応フォーマット
- Vancouver
- APA第7版
- IEEE
- BibTeX
  - SpringerLinkのチャプターは@incollectionとして出力し、booktitleを含みます。
- CSL-JSON (エクスポート)
  - マッピングメモ: CSL-JSON_MAPPING.md
- RIS (エクスポート)

使い方
- 対応ページを開きます
- 拡張アイコンをクリックします
- Fetch citationをクリックします
- スタイルを選びます
- Copyをクリックしてクリップボードにコピーします

ローカル処理
- 現在のページのメタタグやJSON-LDなどを読み取り、ローカルで整形します。

開発環境
- formatterのスナップショットテストにはNode.jsが必要です。
- インストール:
  - npm install

テスト
- npm test

スナップショット更新(出力が意図的に変わった場合)
- npm run test:update

デバッグ(直近のCitationDataを保存)
- 拡張のDevToolsコンソールでデバッグを有効化します:
  - about:debugging#/runtime/this-firefox
  - 拡張を選びInspectをクリック
  - 実行:
    - browser.storage.local.set({ debugMode: true })
- 対応ページでFetch citation実行後、直近データを確認します:
  - browser.storage.local.get(["lastCitationUrl","lastCitationAt","lastCitationData"]).then(console.log)

バージョン方針
- v0.8.x: 機能追加とエクスポート改善(ストアベータとは分離)
- v0.9.0-beta: ストアベータテスト / パッケージング / QA安定化
- v1.0.0: 最初の安定版リリース

ライセンス
- TBD
