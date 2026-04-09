-- AI秘書システム - Supabase スキーマ
-- Supabaseのダッシュボード > SQL Editor でこのSQLを実行してください

-- メモテーブル
CREATE TABLE IF NOT EXISTS memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '無題',
  content TEXT NOT NULL,
  year_month TEXT NOT NULL,         -- 例: '2026-04'
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  memo_id UUID REFERENCES memos(id) ON DELETE SET NULL,  -- メモから昇格した場合の参照
  position INTEGER DEFAULT 0,        -- カンバン内の順序
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_memos_year_month ON memos(year_month);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(status, position);

-- Row Level Security (RLS) - 必要に応じて有効化
-- ALTER TABLE memos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- サンプルデータ（任意）
INSERT INTO memos (title, content, year_month) VALUES
  ('AI秘書システム構築', 'Claude Codeでメモ・タスク管理システムを構築した。Supabase + Vercel + GitHubで全デバイス対応。', '2026-04');

INSERT INTO tasks (title, description, status) VALUES
  ('カンバンアプリをVercelにデプロイ', 'Vercelにデプロイして本番環境を構築する', 'todo'),
  ('Supabaseのテーブルを作成', 'schema.sqlを実行してテーブルを作成する', 'in_progress'),
  ('スマホからのアクセスを確認', 'PWAとして動作することを確認する', 'todo');
