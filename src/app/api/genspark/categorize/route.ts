import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "C0ANJVDA98F";

const CLAUDE_PROXY_URL = process.env.CLAUDE_PROXY_URL!;
const CLAUDE_PROXY_SECRET = process.env.CLAUDE_PROXY_SECRET!;

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

  // 「指示」カテゴリの場合: Claude API → Slack投稿
  if (cat === "指示") {
    try {
      const plainText = htmlToPlainText(data.body);

      // VPS Claude Codeに指示内容を送信
      const proxyRes = await fetch(CLAUDE_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `以下の指示内容を確認し、対応してください。\n\n${plainText}`,
          secret: CLAUDE_PROXY_SECRET,
        }),
      });

      const proxyJson = await proxyRes.json();
      if (!proxyRes.ok || proxyJson.error) {
        throw new Error(proxyJson.error || "Claude proxy error");
      }

      const claudeText = proxyJson.response || "";

      // Slackに親メッセージを投稿（タイトルと指示内容）
      const parentMessage = `*📋 新しい指示: ${data.title}*\n\n>>>  ${truncate(plainText, 1500)}`;
      const parentRes = await postSlackMessage(SLACK_CHANNEL_ID, parentMessage);

      if (parentRes.ok && parentRes.ts) {
        // Claudeの応答をスレッドに投稿
        await postSlackMessage(
          SLACK_CHANNEL_ID,
          `*🤖 Claude応答:*\n\n${claudeText}`,
          parentRes.ts
        );

        // スレッドのtsをSupabaseに保存
        await supabase
          .from("genspark_pending")
          .update({ slack_thread_ts: parentRes.ts })
          .eq("id", id);
      }

      return new NextResponse(
        htmlPage(
          "指示を送信しました",
          `「${data.title}」をClaude AIに送信し、Slackに投稿しました。<br>Slackスレッドで会話を継続できます。`
        ),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("指示処理エラー:", errMsg, err);
      return new NextResponse(
        htmlPage(
          "エラー",
          `指示の処理中にエラーが発生しました。<br><small>${errMsg}</small>`
        ),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  }

  return new NextResponse(
    htmlPage(
      "振り分け完了",
      `「${data.title}」を <strong>${cat}</strong> に振り分けました。<br>次回のGAS実行時にObsidianに保存されます。`
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// ── ヘルパー関数 ──

/** HTMLタグを除去してプレーンテキストに変換 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "・")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 文字列を指定文字数で切り詰め */
function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Slack Web APIでメッセージを投稿 */
async function postSlackMessage(
  channel: string,
  text: string,
  threadTs?: string
): Promise<{ ok: boolean; ts?: string }> {
  const body: Record<string, string> = { channel, text };
  if (threadTs) body.thread_ts = threadTs;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.ok) {
    console.error("Slack投稿エラー:", json.error);
  }
  return { ok: json.ok, ts: json.ts };
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
