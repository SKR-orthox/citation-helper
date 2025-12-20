# Citation Helper (Firefox)

言語: [English](README.md) | [한국어](README.ko.md) | 日本語

バージョン: v0.8.4

Citation Helper は、対応している論文ページから引用情報を生成し、ワンクリックでコピーできる Firefox 拡張機能です。

プライバシー: [PRIVACY.md](PRIVACY.md)

## 対応サイト

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## 出力形式

引用スタイル
- Vancouver
- APA 7
- IEEE

Export
- BibTeX
- CSL-JSON
- RIS

## 著者プリセット

- Default: サイトが提供する著者表記（または可能な範囲で最適な表記）を使用
- Auto initials: 可能な場合、イニシャル形式の著者リストを自動生成
- Raw: 著者文字列をそのまま保持

注: BibTeX / CSL-JSON / RIS は Default プリセットを使用します。

## 使い方

1. 対応している論文の詳細ページを開きます。
2. 拡張機能アイコンをクリックします。
3. **Fetch citation** をクリックします。
4. **Copy** をクリックします。

## 権限

権限は最小限にしています。

- activeTab: 使用時に現在のタブのみへアクセス
- storage: 設定をローカルに保存（uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion）
- clipboardWrite: クリップボードへコピー

ホストアクセスは content script の matches により、対応サイトのみに制限されています。

## 開発

依存関係のインストール
```bash
npm install
```

formatter スナップショットの更新
```bash
npm run test:update
```

テスト実行（環境により）
```bash
npm test
```

## メモ

- 設定はローカルにのみ保存されます。
- 外部ネットワークへのリクエストは行いません。

## ライセンス

リポジトリにライセンスファイルがある場合は、それを参照してください。
