This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase マイグレーションの適用

`supabase/config.toml` が存在せずCLIでlinkされていないため、`supabase/migrations/` 配下のSQLはSupabase CLI（`supabase db push`等）では適用しない。

新しいマイグレーションファイルを追加したら、以下の手順で手動適用する:

1. [Supabaseダッシュボード](https://supabase.com/dashboard) の対象プロジェクトを開く
2. 左メニューから **SQL Editor** を開く
3. `supabase/migrations/` 配下の該当ファイル（例: `20260709_main_building_and_booking_api.sql`）の内容をコピーして貼り付け、実行する
4. 実行後、Table Editorで反映を確認する（例: `rooms` テーブルに本館5室が追加されているか、`bookings` テーブルに新しい列が増えているか）
