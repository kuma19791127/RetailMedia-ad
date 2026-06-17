FROM node:18-alpine

# ffmpeg とビルド用ツールを軽量な apk パッケージからインストール
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /usr/src/app

COPY package*.json ./

# 本番依存モジュールのインストール
RUN npm install --only=production

# アプリケーションソースのコピー
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
