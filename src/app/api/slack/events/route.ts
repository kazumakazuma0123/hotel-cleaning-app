import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHmac, timingSafeEqual } from "crypto";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID || "C0ANJVDA98F";

const CLAUDE_PROXY_URL = process.env.CLAUDE_PROXY_URL || "http://REDACTED_VPS_IP:3002/claude";
const CLAUDE_PROXY_SECRET = process.env.CLAUDE_PROXY_SECRET || "REDACTED_PROXY_SECRET";

// 処理中のスレッドを追跡して重複処理を防ぐ
const processingThreads = new Set<string>();

/**
 * Slack Events API エンドポイント
 * POST /api/slack/events
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── 署名検証 ──
  if (!verifySlackSignature(req, rawBody)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // ── url_verification チャレンジ ──
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // ── デバッグ: 全イベントをSlackに投稿 ──
  if (payload.type === "event_callback") {
    const event = payload.event;
    console.log("Slack event received:", JSON.stringify({ type: event.type, channel: event.channel, thread_ts: event.thread_ts, ts: event.ts, bot_id: event.bot_id, subtype: event.subtype, text: (event.text || "").substring(0, 50) }));

    // message イベントのみ処理
    if (event.type !== "message" && event.type !== "app_mention") {
      return NextResponse.json({ ok: true });
    }

    // サブタイプ付きメッセージ（編集・削除など）は無視
    if (event.subtype) {
      return NextResponse.json({ ok: true });
    }

    // 対象チャンネルのみ
    if (event.channel !== SLACK_CHANNEL_ID) {
      console.log("Channel mismatch:", event.channel, "!==", SLACK_CHANNEL_ID);
      return NextResponse.json({ ok: true });
    }

    // スレッド返信のみ（thread_ts があり、かつ ts !== thread_ts）
    if (!event.thread_ts || event.ts === event.thread_ts) {
      return NextResponse.json({ ok: true });
    }

    // Bot自身の投稿は無視
    if (event.bot_id || event.bot_profile) {
      return NextResponse.json({ ok: true });
    }

    const threadTs = event.thread_ts as string;

    // VPSに転送（タイムアウト回避）
    fetch(CLAUDE_PROXY_URL.replace("/claude", "/slack-reply"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_ts: threadTs,
        channel: event.channel,
        secret: CLAUDE_PROXY_SECRET,
      }),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

// ── バックグラウンド処理 ──

async function handleSlackThread(threadTs: string, _userText: string) {
  processingThreads.add(threadTs);

  try {
    // Supabase から元の指示を検索
    const { data: pendingData } = await supabase
      .from("genspark_pending")
      .select("id, title, body")
      .eq("slack_thread_ts", threadTs)
      .single();

    if (!pendingData) {
      console.log("該当するgenspark_pendingが見つかりません:", threadTs);
      return;
    }

    // スレッド内の全メッセージを取得
    const threadMessages = await fetchSlackThread(
      SLACK_CHANNEL_ID,
      threadTs
    );

    if (!threadMessages || threadMessages.length === 0) {
      return;
    }

    // 元の指示内容をプレーンテキストに変換
    const originalInstruction = htmlToPlainText(pendingData.body);

    // 会話履歴をプロンプトとして構築
    const conversationContext = buildConversationPrompt(threadMessages, originalInstruction);

    // VPS Claude Codeに送信
    const proxyRes = await fetch(CLAUDE_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: conversationContext,
        secret: CLAUDE_PROXY_SECRET,
      }),
    });

    const proxyJson = await proxyRes.json();
    if (!proxyRes.ok || proxyJson.error) {
      throw new Error(proxyJson.error || "Claude proxy error");
    }

    const responseText = proxyJson.response || "";

    // スレッドに返信
    await postSlackMessage(SLACK_CHANNEL_ID, responseText, threadTs);
  } catch (err) {
    console.error("スレッド処理エラー:", err);
    await postSlackMessage(
      SLACK_CHANNEL_ID,
      "⚠️ エラーが発生しました。もう一度お試しください。",
      threadTs
    );
  } finally {
    processingThreads.delete(threadTs);
  }
}

// ── ヘルパー関数 ──

/** Slack署名を検証 */
function verifySlackSignature(req: NextRequest, rawBody: string): boolean {
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const slackSignature = req.headers.get("x-slack-signature");

  if (!timestamp || !slackSignature) return false;

  // リプレイ攻撃防止: 5分以上前のリクエストは拒否
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const mySignature =
    "v0=" +
    createHmac("sha256", SLACK_SIGNING_SECRET)
      .update(sigBasestring)
      .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(slackSignature)
    );
  } catch {
    return false;
  }
}

/** スレッド内のメッセージを取得 */
async function fetchSlackThread(
  channel: string,
  threadTs: string
): Promise<SlackMessage[]> {
  const res = await fetch(
    `https://slack.com/api/conversations.replies?channel=${channel}&ts=${threadTs}&limit=50`,
    {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    }
  );

  const json = await res.json();
  if (!json.ok) {
    console.error("スレッド取得エラー:", json.error);
    return [];
  }
  return json.messages || [];
}

interface SlackMessage {
  ts: string;
  text: string;
  user?: string;
  bot_id?: string;
  bot_profile?: Record<string, unknown>;
}

/** Slackメッセージ履歴からプロンプト文字列を構築 */
function buildConversationPrompt(
  messages: SlackMessage[],
  originalInstruction: string
): string {
  let prompt = `あなたはSlack上で指示を受けて作業するアシスタントです。日本語で簡潔に応答してください。\n\n元の指示内容:\n${originalInstruction}\n\n--- 会話履歴 ---\n`;

  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    const isBot = !!msg.bot_id || !!msg.bot_profile;
    const role = isBot ? "アシスタント" : "ユーザー";
    prompt += `\n${role}: ${msg.text}\n`;
  }

  prompt += "\n上記の会話を踏まえて、最後のユーザーのメッセージに応答してください。";
  return prompt;
}

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

/** リアクションを付ける */
async function addReaction(channel: string, timestamp: string, name: string) {
  await fetch("https://slack.com/api/reactions.add", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, timestamp, name }),
  });
}
