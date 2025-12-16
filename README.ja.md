# Citation Helper

言語:
- English (README.md)
- 한국어 (README.ko.md)
- 日本語 (README.ja.md)

Citation Helper は、対応する論文ページから引用情報を抽出し、参考文献形式に整形する Firefox 拡張機能です。

対応サイトを増やすことよりも、形式の正確性と安定性を優先しています。

## 主な機能

- 対応サイトの論文ページから引用情報を抽出
- スタイル:
  - Vancouver
  - APA 第7版
  - IEEE
  - BibTeX
- 著者ルール:
  - Vancouver の et al. 処理
  - APA 7 の 21名以上省略ルール
- DOI、PMID、pages、eLocator を処理（取得できる場合）
- UI 多言語: 英語、韓国語、日本語
- ワンクリックコピー

## 対応サイト

- PubMed
  - https://pubmed.ncbi.nlm.nih.gov/
- Nature (nature.com)
  - https://www.nature.com/（論文ページ）

対応範囲は意図的に限定しています。新しいサイトはテストセットを通過してから追加し、既存サイトの回帰を避けます。

## 使い方

1. 対応する論文ページを開きます。
2. 拡張アイコンをクリックします。
3. 形式と言語を選択します。
4. 引用を取得 を押します。
5. コピー でコピーします。

## プライバシー/ネットワーク

- 引用データはブラウザ内でローカル処理されます。
- 解析/トラッキングはありません。
- ページ内容を外部サーバーへ送信しません。
- クリップボードは コピー を押したときのみ使用します。

## 開発用インストール (Firefox)

1. about:debugging を開く
2. This Firefox
3. Load Temporary Add-on…
4. manifest.json を選択

## ライセンス

MIT License