#!/bin/bash
# VPS デプロイスクリプト
# port 3001（モニターサーバー）経由でVPSにファイルを配置・プロセス管理する
#
# 使い方:
#   ./scripts/vps-deploy.sh deploy                                  # claude-proxy-server.js をデプロイ＋再起動
#   ./scripts/vps-deploy.sh write /root/file.sh local-file.sh       # 任意ファイル書き込み
#   ./scripts/vps-deploy.sh restart                                 # port 3002 プロセス再起動
#   ./scripts/vps-deploy.sh status                                  # port 3002 プロセス状態確認

set -euo pipefail
cd "$(dirname "$0")/.."

VPS_URL="http://REDACTED_VPS_IP:3001"
API_KEY="changeme"

ACTION="${1:-deploy}"

vps_file() {
  jq -n --arg action "$1" --arg file "$2" --arg content "$3" \
    '{action:$action, file:$file, content:$content}' | \
  curl -sf -X POST "$VPS_URL/api/vps-file" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @- --max-time 15
}

case "$ACTION" in
  deploy)
    echo ">>> Writing claude-proxy-server.js to VPS..."
    CONTENT=$(cat scripts/claude-proxy-server.js)
    vps_file write "/root/claude-proxy-server.js" "$CONTENT"
    echo ""
    echo ">>> Restarting proxy on :3002..."
    vps_file start-proxy "" ""
    echo ""
    sleep 3
    echo ">>> Checking status..."
    vps_file status "" ""
    echo ""
    echo ">>> Done."
    ;;
  write)
    VPS_PATH="${2:?Usage: $0 write /root/path local-file}"
    LOCAL_FILE="${3:?Usage: $0 write /root/path local-file}"
    echo ">>> Writing $LOCAL_FILE → $VPS_PATH"
    CONTENT=$(cat "$LOCAL_FILE")
    vps_file write "$VPS_PATH" "$CONTENT"
    echo ""
    echo ">>> Done."
    ;;
  restart)
    echo ">>> Restarting proxy on :3002..."
    vps_file start-proxy "" ""
    echo ""
    echo ">>> Done."
    ;;
  status)
    vps_file status "" ""
    echo ""
    ;;
  *)
    echo "Usage: $0 {deploy|write|restart|status}"
    echo ""
    echo "  deploy   Write claude-proxy-server.js + restart :3002"
    echo "  write    Write arbitrary file: $0 write /root/path local-file"
    echo "  restart  Restart :3002 process"
    echo "  status   Check :3002 process status"
    exit 1
    ;;
esac
