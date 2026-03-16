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
