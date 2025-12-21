# Citation Helper (Firefox)

言語: [English](README.md) | [한국어](README.ko.md) | 日本語

Version: v0.9.0 (0.9.0-beta)

Citation Helper は、対応している論文ページからメタデータを抽出し、参考文献を生成してワンクリックでコピー/エクスポートできる Firefox 拡張です。

プライバシー: [PRIVACY.md](PRIVACY.md)

## ベータ配布 (AMO Unlisted)

このバージョンは AMO Unlisted（自己配布）で署名済み XPI を取得して配布するベータ運用を想定しています。
署名済み `.xpi` を受け取った場合は、以下の手順でインストールしてください。

## 対応サイト

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## 例 URL

- PubMed: https://pubmed.ncbi.nlm.nih.gov/10238015/
- Nature: https://www.nature.com/articles/d41586-024-04246-9
- SpringerLink (article): https://link.springer.com/article/10.1007/s11192-024-05163-4
- SpringerLink (chapter): https://link.springer.com/chapter/10.1007/978-1-0716-1418-1_2

テストセット（fixtures + policy case）: [0.8.5-cases.md](0.8.5-cases.md)

## 出力形式

引用スタイル
- Vancouver
- APA 7
- IEEE

エクスポート
- BibTeX
- CSL-JSON
- RIS

## 著者プリセット

- Default: サイトが提供する形式を優先（可能な範囲で最適）
- Auto initials: 可能な場合はイニシャル形式で著者表記を生成
- Raw: 著者文字列をそのまま保持

注: BibTeX / CSL-JSON / RIS は Default プリセットを使用します。

## 使い方

- 対応している論文ページを開きます。
- 拡張アイコンをクリックします。
- **Fetch citation** をクリックします。
- **Copy** をクリックします。

## インストール（署名済み XPI）

- Firefox のアドオン管理画面を開く（`about:addons`）
- 歯車メニューをクリック
- **ファイルからアドオンをインストール…** を選択
- 署名済み `.xpi` を選択

## 制限 / 注意点

- v0.9.0 では上記サイトのみ対応です。
- メタデータはページの meta タグ / JSON-LD から抽出します。ページに存在しない項目は出力にも含まれません。
- 現在のタブのみ対象です。PDF をダウンロード/解析しません。
- すべてローカルで処理し、サーバーへ送信しません。

## 権限 (Permissions)

最小限の権限を目指しています。

- `activeTab`: 使用時のみ現在のタブにアクセス
- `storage`: 設定(uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion)をローカル保存
- `clipboardWrite`: クリップボードへコピー

ホストアクセスは content script の matches により対応サイトに限定されます。

## 開発

依存関係のインストール
```bash
npm install
```

formatter スナップショット更新
```bash
npm run test:update
```

テスト実行
```bash
npm test
```

Firefox で実行（仮インストール）
```bash
npx web-ext run
```

AMO アップロード用 zip をビルド
```bash
npx web-ext build --overwrite-dest
```

## フィードバック / 不具合報告

不具合報告の際は、できれば以下を含めてください。

- URL
- 期待する結果と実際の結果
- 使用した出力形式と著者プリセット
- （任意）メタデータ/引用情報付近のスクリーンショット

## ライセンス

リポジトリ内のライセンスファイル（存在する場合）を参照してください。
