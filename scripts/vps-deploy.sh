#!/bin/bash
# VPS デプロイスクリプト
# ローカルMac → Vercel → VPS の経路でファイルをデプロイする
#
# 使い方:
#   ./scripts/vps-deploy.sh deploy                    # claude-proxy-server.js をデプロイ
#   ./scripts/vps-deploy.sh restart                   # VPSプロセス再起動
#   ./scripts/vps-deploy.sh deploy-restart             # デプロイ＋再起動
#   ./scripts/vps-deploy.sh bootstrap                  # 初回セットアップ（/deploy未実装の旧版向け）
#   ./scripts/vps-deploy.sh deploy /root/file.sh local-file.sh  # 任意ファイル

set -euo pipefail
cd "$(dirname "$0")/.."

VERCEL_URL="https://hotel-cleaning-app.vercel.app"
DEPLOY_SECRET="REDACTED_DEPLOY_SECRET"

ACTION="${1:-deploy}"
VPS_PATH="${2:-/root/claude-proxy-server.js}"
LOCAL_FILE="${3:-scripts/claude-proxy-server.js}"

send() {
  curl -sf -X POST "$VERCEL_URL/api/vps/deploy" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg secret "$DEPLOY_SECRET" \
      --arg action "$1" \
      --arg file "$2" \
      --arg content "$3" \
      '{secret:$secret, action:$action, file:$file, content:$content}')" \
    2>&1
}

case "$ACTION" in
  deploy)
    echo ">>> Deploying $LOCAL_FILE → $VPS_PATH"
    CONTENT=$(cat "$LOCAL_FILE")
    send deploy "$VPS_PATH" "$CONTENT"
    echo ""
    echo ">>> Done."
    ;;
  restart)
    echo ">>> Restarting VPS proxy..."
    send restart "" ""
    echo ""
    echo ">>> Done."
    ;;
  deploy-restart)
    echo ">>> Deploying $LOCAL_FILE → $VPS_PATH"
    CONTENT=$(cat "$LOCAL_FILE")
    send deploy "$VPS_PATH" "$CONTENT"
    echo ""
    echo ">>> Restarting VPS proxy..."
    sleep 1
    send restart "" ""
    echo ""
    echo ">>> Done."
    ;;
  bootstrap)
    echo ">>> Bootstrap: deploying via Claude Code (slow, ~60s)..."
    CONTENT=$(cat "$LOCAL_FILE")
    send bootstrap "" "$CONTENT"
    echo ""
    echo ">>> Done. VPS proxy should restart automatically."
    ;;
  *)
    echo "Usage: $0 {deploy|restart|deploy-restart|bootstrap} [vps_path] [local_file]"
    exit 1
    ;;
esac
