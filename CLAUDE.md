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
npm run dev         # 開発サーバー起動
npm run build       # ビルド
npm run lint        # ESLint実行
npm run sync:rules  # Obsidianの清掃ルールmdをアプリに同期
```

## 清掃ルール（Villa Rules）の編集フロー

`/manual/villa` ページの内容は markdown ファイルで管理されている。

- **真のソース**: `/Users/kazuma/Downloads/obsidian_project/hotel-sui/03_清掃管理/villa-rules.md`
- **アプリ側コピー**: `src/content/villa-rules.md`（ビルド時に読み込まれる）
- **bizdev mirror**: `hotel/hotel-sui/アクション/清掃/villa-rules.md`

### 編集手順
1. Obsidian で `villa-rules.md` を編集
2. アプリディレクトリで `npm run sync:rules` を実行（Obsidian → src/content/ にコピー）
3. `git commit && git push` で Vercel に反映

### markdown 記法
- `## NN タイトル` → 番号付きセクション（NNはセクション番号）
- `### サブタイトル` → サブ見出し
- `- bullet` → 箇条書き
- `==text==` → グレー背景の強調テキスト
- `![キャプション](/images/manual/xxx.jpg)` → 画像（直前のサブセクションに紐付く）

パーサ実装: `src/lib/parseVillaRules.ts`

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
