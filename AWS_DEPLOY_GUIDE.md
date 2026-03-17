# AWS Deployment Guide (Retail Media System)

このシステム（Node.jsアプリ）をAWS上で公開するための手順です。
最も簡単で管理が楽な **AWS App Runner** を推奨します。

## 1. 準備 (Prerequisites)
1.  **GitHubリポジトリ:** このフォルダの中身がGitHubにアップロードされていること。
2.  **AWSアカウント:** 作成済みであること。

---

## 2. AWS App Runner でのデプロイ（推奨）
サーバー管理不要で、GitHubと連携して全自動で公開できるサービスです。

1.  [AWSコンソール (App Runner)](https://console.aws.amazon.com/apprunner) を開く。
2.  **「サービスの作成 (Create service)」** をクリック。
3.  **ソース:** 「ソースコードリポジトリ」を選択し、「次へ」。
4.  **接続:** GitHubアカウントを連携し、今回のリポジトリ（例: `RetailMedia`）を選択。
5.  **設定:**
    *   **ランタイム:** `Node.js 16` (または最新)
    *   **ビルドコマンド:** `npm install`
    *   **開始コマンド:** `node server.js`
    *   **ポート:** `3000`
6.  **デプロイ:** 「作成とデプロイ」をクリック。

👉 数分後、発行されたURL（例: `https://xyz.awsapprunner.com`）にアクセスすれば、世界中からダッシュボードが見られるようになります！

---

## 3. AWS EC2 でのデプロイ（上級者向け）
自分でサーバー(Linux)を管理したい場合の手順です。

1.  **EC2インスタンス起動:** Amazon Linux 2023 または Ubuntu を起動。
2.  **ポート開放:** セキュリティグループで `3000` 番ポートを許可。
3.  **セットアップ:**
    ```bash
    # Node.jsのインストール
    sudo yum install -y nodejs 
    
    # コードの取得
    git clone https://github.com/your-name/RetailMedia.git
    cd RetailMedia
    
    # 起動
    npm install
    node server.js
    ```
4.  `http://(EC2のIPアドレス):3000` でアクセス。

---

## 💡 ヒント
*   **ドメイン:** AWS Route 53 を使えば、`https://ads.your-shop.com` のような独自ドメインも設定可能です。
*   **コスト:** App Runnerは使っていない時は自動で停止設定(一時停止)も可能ですが、稼働中は料金がかかります。
