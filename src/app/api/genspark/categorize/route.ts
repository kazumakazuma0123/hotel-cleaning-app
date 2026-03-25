import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Genspark カテゴリ選択エンドポイント
 * LINEのボタンからURLで呼ばれる
 * GET /api/genspark/categorize?id=xxx&cat=議事録
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const cat = req.nextUrl.searchParams.get("cat");

  if (!id || !cat) {
    return new NextResponse(htmlPage("エラー", "パラメータが不足しています"), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Supabase更新
  const { data, error } = await supabase
    .from("genspark_pending")
    .update({ category: cat, status: "answered" })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !data) {
    return new NextResponse(
      htmlPage("処理済み", "この項目は既に振り分け済みか、見つかりませんでした。"),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    htmlPage(
      "振り分け完了",
      `「${data.title}」を <strong>${cat}</strong> に振り分けました。<br>次回のGAS実行時にObsidianに保存されます。`
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 32px; max-width: 400px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 20px; margin-bottom: 12px; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
