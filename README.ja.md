# Citation Helper (Firefox) - v0.7.0

対応している論文ページから参考文献の形式を生成し、コピーできるFirefox拡張です。

## 対応サイト
- PubMed - https://pubmed.ncbi.nlm.nih.gov/<PMID>/
- Nature.com - https://www.nature.com/articles/<ARTICLE_ID>

## 対応スタイル
- Vancouver
- APA第7版
- IEEE
- BibTeX

## 使い方
1. 対応している論文ページ(PubMedまたはNature)を開きます。
2. 拡張アイコンからポップアップを開きます。
3. スタイルを選んで生成します。
4. Copyでクリップボードにコピーします。

## デバッグモード(テスト用JSON)
デバッグモードを有効にすると、最後に抽出したCitationDataをブラウザの保存領域に保存します。
回帰テスト用のfixture(JSON)作成に使います。

有効化:
- 拡張ポップアップのDevToolsコンソールで実行
  browser.storage.local.set({ debugMode: true })

確認:
- browser.storage.local.get(["lastCitationUrl","lastCitationData","lastCitationAt"]).then(console.log)

## テスト(スナップショット)
サイト追加やextractor修正時に、既存サイトが壊れないようにfixtures + snapshotテストを使います。

実行:
- npm test

スナップショット作成/更新:
- npm test -- --update

## 設計方針
- formattersはサイト非依存として安定維持します。
- サイト差分はextractorと正規化層で吸収します。
- extractorの出力は共通のCitationDataスキーマに統一します。

## CitationDataスキーマ(主要フィールド)
- authors: string[]
- title: string
- journalFull: string
- journalAbbrev: string(任意)
- year, volume, issue, pages
- pmid(PubMedのみ)
- doi(任意)
- url