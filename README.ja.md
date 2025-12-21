# Citation Helper

言語: [English](README.md) | [한국어](README.ko.md) | 日本語

**バージョン:** v0.9.0-beta

対応している論文/記事ページからメタデータを抽出し、参考文献を生成してワンクリックでコピー/エクスポートできる拡張機能です。

**プライバシー:** [PRIVACY.md](PRIVACY.md)

## 対応ブラウザ

- **Firefox**: 署名済み XPI（AMO Unlisted / 自己配布ベータ）
- **Chrome**: Chrome Web Store（公開登録、現在審査中）

## 対応サイト

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## 出力形式

- Vancouver
- APA 7th
- IEEE
- BibTeX
- CSL-JSON
- RIS

## インストール

### Firefox（署名済み XPI）

署名済み `.xpi` がある場合:

- `about:addons` を開く
- 歯車アイコンをクリック
- **ファイルからアドオンをインストール...** を選択
- `.xpi` を選ぶ

### Chrome

Chrome Web Store の審査が通ったら、ストアからインストールできます。

ローカルテスト（デベロッパーモード）:

- `chrome://extensions` を開く
- **デベロッパーモード** を有効化
- **パッケージ化されていない拡張機能を読み込む** をクリック
- `manifest.json` があるフォルダを選択

## 使い方

- 対応している論文/記事ページを開く
- ツールバーの **Citation Helper** アイコンをクリック
- **Style / Language / Authors** を選ぶ
- **Fetch citation** をクリック
- **Copy** をクリック（または任意の形式でエクスポート）

## フィードバック / バグ報告

GitHub Issues からお願いします。

バグ報告の際は、以下を含めてください。

- URL
- 期待する結果 / 実際の結果
- 使用した形式（Style）と Authors プリセット
- （任意）ページの引用/メタデータ部分のスクリーンショット

## 開発

必要: Node.js（formatter のテスト/スクリプト用）

- テスト: `npm test`
- スナップショット更新: `npm run test:update`

パッケージング:

- **Firefox**: `npx web-ext build`（AMO 署名用 ZIP を生成）
- **Chrome**: `manifest.json` が ZIP のルートに来るように圧縮（フォルダの二重化は不可）

## ライセンス

リポジトリのライセンスファイル（例: `LICENSE`）を参照してください。
