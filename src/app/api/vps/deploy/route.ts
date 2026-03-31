import { NextRequest, NextResponse } from "next/server";

const CLAUDE_PROXY_URL =
  process.env.CLAUDE_PROXY_URL || "http://162.43.29.31:3002";
const CLAUDE_PROXY_SECRET =
  process.env.CLAUDE_PROXY_SECRET || "genspark-claude-proxy-2026";
const DEPLOY_SECRET = process.env.DEPLOY_SECRET || "vps-deploy-2026";

/**
 * VPS デプロイリレー
 * POST /api/vps/deploy
 *
 * ローカルMac → Vercel → VPS の経路でファイルデプロイ＆再起動を行う。
 * ローカルMacからVPSへ直接SSH接続できない問題の恒久対策。
 *
 * actions:
 *   "deploy"    — VPS:3002/deploy にファイル内容を送信して書き込み
 *   "restart"   — VPS:3002/restart でプロセス再起動
 *   "bootstrap" — VPS:3002/claude 経由でClaude Codeにファイル書き込み＋再起動させる（初回用）
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== DEPLOY_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { action, file, content } = body;
  const proxyBase = CLAUDE_PROXY_URL.replace(/\/claude$/, "");

  try {
    if (action === "deploy") {
      const res = await fetch(proxyBase + "/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: CLAUDE_PROXY_SECRET, file, content }),
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }

    if (action === "restart") {
      try {
        await fetch(proxyBase + "/restart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: CLAUDE_PROXY_SECRET }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // restart kills the connection — expected
      }
      return NextResponse.json({ ok: true, message: "restart requested" });
    }

    if (action === "bootstrap") {
      // 初回: /deploy エンドポイントがまだない旧版に対して
      // /claude 経由でClaude Codeにファイル書き込み＋再起動を依頼
      // Fire-and-forget: VPSにリクエストを送ったら即return（Vercel関数タイムアウト対策）
      const prompt = `以下の手順を正確に実行してください:

1. /root/claude-proxy-server.js を以下の内容で上書きしてください
2. 上書き後、以下のbashコマンドを実行してプロセスを再起動してください:
   nohup bash -c 'sleep 3; kill $(lsof -t -i:3002 -sTCP:LISTEN) 2>/dev/null; sleep 2; cd /root && nohup node claude-proxy-server.js >> claude-proxy.log 2>&1 &' > /dev/null 2>&1 &

ファイル内容:
${content}`;

      // 3秒でVPSにリクエスト送信後、即return
      // VPS側はリクエスト受信後にClaude Codeを非同期実行するため処理は続く
      try {
        await fetch(proxyBase + "/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: CLAUDE_PROXY_SECRET, prompt }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // タイムアウトは想定内（Claude処理は60秒以上かかる）
      }
      return NextResponse.json({
        ok: true,
        message: "bootstrap started — VPS will process in background (~60s). Check with restart action after.",
      });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
