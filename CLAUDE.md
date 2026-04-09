# AI秘書システム - Claude Code 操作マニュアル

このリポジトリは、メモとタスクを一元管理するAI秘書システムです。

## ディレクトリ構成

```
/
├── CLAUDE.md          # このファイル（操作マニュアル）
├── memos/             # 月別メモ（Markdown）
│   └── YYYY-MM.md
├── kanban/            # カンバンWebアプリ（Next.js + Supabase）
└── supabase/
    └── schema.sql     # DBスキーマ
```

## メモ操作

### メモを保存する

ユーザーが「メモして」「メモ：〇〇」「〇〇をメモ」などと言ったら：

1. 現在の年月（YYYY-MM形式）を確認する
2. `memos/YYYY-MM.md` ファイルを開く（なければ作成）
3. 以下の形式でメモを末尾に追記する：

```markdown
## HH:MM - タイトル

内容

---
```

4. Supabase にも保存する（`save_memo` 関数を使う）：

```bash
curl -X POST "$SUPABASE_URL/rest/v1/memos" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "メモ内容",
    "title": "タイトル",
    "year_month": "YYYY-MM"
  }'
```

5. 「保存しました」と報告する

### メモを検索する

ユーザーが「〇〇のメモ探して」「〇〇について調べて」と言ったら：

- `memos/` ディレクトリ内のMarkdownファイルをgrepで検索する
- 関連するメモを見つけて内容を表示する

### 今月のメモ一覧

ユーザーが「今月のメモ見せて」と言ったら：

- `memos/$(date +%Y-%m).md` を読み込んで表示する

---

## タスク操作

### タスクを追加する

ユーザーが「タスクにして」「タスク追加して」「〇〇をやること追加」などと言ったら：

```bash
curl -X POST "$SUPABASE_URL/rest/v1/tasks" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "タスクタイトル",
    "description": "詳細説明",
    "status": "todo"
  }'
```

### タスクのステータスを更新する

ユーザーが「進行中にして」「着手した」と言ったら → status を `in_progress` に変更
ユーザーが「完了にして」「終わった」「done」と言ったら → status を `done` に変更

まずタスクを検索：
```bash
curl "$SUPABASE_URL/rest/v1/tasks?title=ilike.*キーワード*&select=id,title,status" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

次にステータス更新：
```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/tasks?id=eq.{TASK_ID}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

### タスク一覧を見る

ユーザーが「タスク見せて」「今のタスクは？」と言ったら：

```bash
curl "$SUPABASE_URL/rest/v1/tasks?select=*&order=created_at.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

ステータス別に整理して表示する：
- 📋 TODO
- 🔄 進行中
- ✅ 完了

---

## 環境変数

`.env.local` に以下を設定してください：

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## よく使うフレーズ対応表

| ユーザーの言葉 | Claudeの動作 |
|---|---|
| 「メモして」 | 会話内容を整理してメモ保存 |
| 「〇〇をメモ」 | 〇〇をメモ保存 |
| 「タスクにして」 | 直前のメモをタスクとして追加 |
| 「タスク追加：〇〇」 | 〇〇をtodoタスクとして追加 |
| 「〇〇を進行中にして」 | タスクのステータスをin_progressに |
| 「〇〇完了」 | タスクのステータスをdoneに |
| 「今月のメモ」 | 今月のメモ一覧を表示 |
| 「タスク確認」 | 全タスクをステータス別に表示 |
| 「〇〇のメモ探して」 | メモファイルからキーワード検索 |
