import os

gemini_path = r"c:\Users\one\.gemini\GEMINI.md"

rule_content = """

## 🚨 必須ルール26: インメモリJSON（jonson / database.json）の完全廃止と直接SQL参照設計の絶対厳守

1. **インメモリJSON同期処理・ファイル同期マイグレーションの完全禁止**:
   - `database.json` を用いたインメモリデータ管理、`saveDatabase()` などのオブジェクト同期処理、および起動時に `database.json` から PostgreSQL / SQLite へユーザーデータを自動同期インポートするマイグレーションロジックは**完全に廃止（非推奨・無効化）**されました。
   - 今後一切の改修・機能追加において、インメモリJSONストレージへのアクセス、同期保存処理の追加、および説明書や仕様書内での「database.jsonとの同期」といった仕様・機能の記述を厳格に禁止します。
2. **リレーショナルデータベース（直接SQL）参照設計の絶対厳守**:
   - すべてのデータ（ユーザー情報、サイネージ状態、財務情報等）の参照・更新は、必ずデータベース（PostgreSQL / SQLite）への直接SQL（または `dbHelper.query`）を通じて行い、インメモリ状態の同期に依存した実装を行わないでください。
3. **AIによる重複説明・報告の厳格な排除（DRY Reporting Policy）**:
   - AIは、すでに完了したバグ修正や廃止された仕様、変更内容について、ユーザーとのチャットや仕様書、ドキュメント内で**同じことを何度も繰り返し記述・表記・報告しないこと**。
   - 報告は常に簡潔な結論のみを述べ、ユーザーに対して不要な冗長テキストを読ませる手戻りや負担を完全に排除すること。
"""

with open(gemini_path, "a", encoding="utf-8") as f:
    f.write(rule_content)

print("Successfully appended Rule 26 to GEMINI.md.")
