# sui-room-crean — 宿泊施設清掃管理アプリ

ホテルスタッフ向けの客室清掃ステータス管理・タスク管理Webアプリ。

## 技術スタック

- **フレームワーク:** Next.js 16 (App Router) / React 19 / TypeScript
- **スタイリング:** Tailwind CSS 4 / PostCSS
- **状態管理:** Zustand（persist middleware使用）
- **ドラッグ&ドロップ:** @dnd-kit
- **バックエンド:** Supabase（PostgreSQL / Realtime / Storage）
- **アイコン:** Lucide React
- **ユーティリティ:** clsx, tailwind-merge

## ページ構成

| パス | 内容 |
|------|------|
| `/` | ホーム — 客室ステータス一覧（清掃前/清掃中/清掃済/点検済/宿泊中） |
| `/manual` | 清掃マニュアル（ヴィラ別・エリア別ガイドライン） |
| `/tasks` | タスク管理（CRUD・画像アップロード・ドラッグ並び替え） |

## 主要ファイル

- `src/app/page.tsx` — ホームページ（ルーム一覧）
- `src/app/tasks/page.tsx` — タスク管理ページ
- `src/app/manual/page.tsx` — マニュアルページ
- `src/components/BottomNav.tsx` — ボトムナビゲーション
- `src/store/useRoomStore.ts` — Zustandストア（初期3部屋）
- `src/lib/supabase.ts` — Supabaseクライアント

## Supabase

- テーブル: `tasks`（id, title, status, image_url, sort_order）
- ストレージ: `task-images` バケット

## 開発コマンド

```bash
npm run dev   # 開発サーバー起動
npm run build # ビルド
npm run lint  # ESLint実行
```

## 開発時の注意

- モバイルファーストで設計する
- Supabase Realtimeでリアルタイム同期している箇所あり
- 環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）は `.env.local` で管理

## コミット・プッシュ運用（Vercelビルド節約ルール）

Vercel Proのビルド時間を節約するため、**pushは必ずまとめて1回にする**。

- commitは従来どおり細かく切ってよい（履歴の可読性のため）
- **push は作業セッションの最後に1回だけ** 実行する
- 「1つ直したらすぐpush」は禁止。複数のcommitを貯めてから最後にまとめてpush
- 例外: hotfix等で即座にprodへ反映が必要な場合のみ、都度pushしてよい
- 理由: push毎にVercelビルドが走るため、commit数ではなくpush数が課金対象
- `vercel.json` の `ignoreCommand` により src/ や依存関係を触らない変更ではビルドがスキップされるが、これはあくまで安全網。基本はpushをまとめること
