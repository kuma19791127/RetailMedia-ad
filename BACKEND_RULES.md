# RetailMedia System - バックエンド開発ルール (Backend Rules)

## 🚨 必須ルール1: データ永続化 (S3保存) の徹底

機能追加や既存機能の改善において、バックエンド（`server_retail_dist.js` 等）でデータを変更するエンドポイント（POST, PUT, DELETE）を作成・修正する場合は、**必ずS3への保存関数を呼び出すこと**を必須とします。

メモリ上の変数を更新しただけでは、システム再起動時（AppRunner等のコンテナ再起動）に変更内容がすべて消失し、致命的なデータロストに繋がります。

### 保存関数の使い分け

エンドポイントで扱うデータの種類に応じて、以下のいずれかの関数を必ず同期的に呼び出してください。

#### 1. `saveDatabase()`
- **対象データ**: ユーザー情報 (`users`)、サイネージ設定 (`storeData`, `signageState`)、キャンペーン情報 (`campaigns`)、実績データ (`transactions`) など、システム全般のデータ。
- **使用例**:
  ```javascript
  app.post('/api/example', (req, res) => {
      users[req.body.email] = req.body.data;
      if (typeof saveDatabase === 'function') saveDatabase(); // 必須
      res.json({ success: true });
  });
  ```

#### 2. `saveFinanceDB()`
- **対象データ**: 出金リクエスト (`withdrawalRequests`)、本人確認データ (`kycRequests`)、振込先口座情報 (`creatorBanks`)、代理店データ (`agencyReferrals`) などの金融・審査系データ。
- **使用例**:
  ```javascript
  app.post('/api/creator/withdraw', (req, res) => {
      withdrawalRequests.push(req.body.request);
      if (typeof saveFinanceDB === 'function') saveFinanceDB(); // 必須
      res.json({ success: true });
  });
  ```

---

## 🚨 必須ルール2: 認証とセキュリティ (Authentication & Security)

ユーザーの認証状態や機密情報を扱う際は、以下のセキュリティ基準を遵守してください。

1. **パスワードの平文保存禁止**: 
   新規登録やパスワードリセット時、パスワードは必ず `crypto.scryptSync` 等を用いてハッシュ化してから保存すること。
2. **グローバル変数によるセッション管理の禁止**:
   `currentUser` のようなグローバル変数にログイン状態を保持すると、複数ユーザーからの同時リクエスト時にセッション情報が混同する（他人のアカウントにログインしてしまう）致命的なバグが発生します。
   **必ず JWT (JSON Web Token) と HTTP-Only Cookie を用いてリクエスト単位で認証状態を管理** してください。

---

## 🚨 必須ルール3: 重要処理の排他制御 (Mutex & Concurrency)

出金処理やポイント付与など、**二重実行されるとシステムや財務に致命的な影響を与えるAPI** を実装する際は、必ずメモリ上の排他制御（Mutex）を組み込んでください。

- **実装例**:
  ```javascript
  const processingTasks = new Set();
  
  app.post('/api/critical/task', (req, res) => {
      const taskId = req.body.taskId;
      if (processingTasks.has(taskId)) {
          return res.status(409).json({ error: "現在処理中です" }); // 連打防止
      }
      processingTasks.add(taskId);
      
      try {
          // ... 重要な処理 ...
      } finally {
          processingTasks.delete(taskId); // 確実なロック解除
      }
  });
  ```

---

## 🚨 必須ルール4: スケーラビリティとメモリ管理 (Scalability)

現在進行中の SQLite への移行フェーズにおけるルールです。

1. **巨大なインメモリ同期処理の回避**:
   `users` や `financeDB` などの全件データが入った辞書（オブジェクト）に対する同期的な巨大JSON変換は、イベントループをブロックしサーバーを停止させる原因となります。
2. **新規機能のデータベース設計**:
   今後新たに追加するデータモデルや大量のトランザクションが予想される機能（出金履歴、ログデータなど）は、極力JSONではなく **SQLite (`db_sqlite.js`) を用いた非同期処理** で設計してください。

---

## 🚨 必須ルール5: 外部API・LLMの耐障害性とモデルの動的フォールバック (LLM API & Resilience)

Google Geminiなどの外部生成AI APIを使用する際は、モデルの廃止やAPI仕様の変更によってシステムが突然停止（500エラー等）することを防ぐため、以下の設計基準を遵守してください。

1. **複数モデルによる自動フォールバックとリトライ機構の搭載**
   単一のモデル名（例: `gemini-2.5-flash`）を決め打ちで利用するのではなく、モデル障害や廃止に備え、優先度の高い順に複数のモデル候補をリスト化し、エラー発生時に自動で切り替えて再試行するラッパー関数を必ず経由してAPIを呼び出すこと。
   - **優先度リストの例**: `['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-pro']`
2. **通信障害やキー未設定時のフォールバック（デモ動作）の保証**
   APIキーが設定されていない場合や、通信障害等によりすべてのモデルで応答が得られなかった場合でも、システム自体をクラッシュ（500エラー）させず、事前に用意された適切なデモ用（フォールバック）データを返却してフロントエンドの表示や最低限のサービス継続を保証すること。

---

## 🚨 必須ルール6: 開発中のファイル破損・タグ整合性チェック (File Integrity & Syntax Validation)

セッション切り替え時などのコンテキスト忘却（忘れること）によるバグ再発を防ぐため、HTML/JSファイルを編集またはGitプッシュする際は、以下のファイル整合性チェックを必ず実行してください。

1. **スクリプト・HTMLタグの「数」と「末尾」の整合性検証**
   - 単に正規表現で `<script>`〜`</script>` の間を切り出して文法チェックをかけるだけでは、**「閉じタグ自体が欠落してファイルが途中で切れている破損」** を検知できません。
   - ファイルを編集した際は、必ず `<script>`と`</script>`、`<form>`と`</form>`、`<div>`と`</div>` などの**開きタグと閉じタグの総数が一致していること**、およびファイル末尾が `</html>` などの正規のタグで閉じられているかをプログラム的または目視で必ず検証すること。
2. **Gitプッシュ前の構文チェック実行義務**
   - どのような軽微な変更であっても、Gitプッシュを行う直前には、プロジェクト内にある構文検証スクリプトを実行し、エラー（Syntax Error）が一切存在しないことを確認してからプッシュすること。
