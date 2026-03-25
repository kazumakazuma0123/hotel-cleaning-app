-- Genspark 保留カテゴリ選択テーブル
-- Supabase SQL Editor で実行

CREATE TABLE IF NOT EXISTS genspark_pending (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  email_date TIMESTAMPTZ NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | answered | processed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS有効化 + anon keyからのアクセス許可
ALTER TABLE genspark_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON genspark_pending
  FOR ALL USING (true) WITH CHECK (true);
