#!/usr/bin/env bash
#
# Obsidian Vault の清掃ルール markdown を、アプリ内 src/content/ にコピーする。
#
# Usage:
#   npm run sync:rules
#
# 編集の真のソース: /Users/kazuma/Downloads/obsidian_project/hotel-sui/03_清掃管理/*.md
# アプリ側コピー先: hotel/sui-room-crean/src/content/*.md
#
# このスクリプト実行後に commit & push すれば、Vercel ビルドで反映される。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

OBSIDIAN_DIR="/Users/kazuma/Downloads/obsidian_project/1.HOTEL/03_清掃管理"
BIZDEV_MIRROR_DIR="/Users/kazuma/Downloads/bizdev/HOTEL SUI/hotel-sui/アクション/清掃"
APP_CONTENT_DIR="$APP_DIR/src/content"

# 同期対象ファイル
FILES=(
    "villa-rules.md"
    "main-rules.md"
)

mkdir -p "$APP_CONTENT_DIR"
mkdir -p "$BIZDEV_MIRROR_DIR"

for f in "${FILES[@]}"; do
    src="$OBSIDIAN_DIR/$f"
    if [[ ! -f "$src" ]]; then
        echo "✗ $src が見つかりません" >&2
        exit 1
    fi

    cp "$src" "$APP_CONTENT_DIR/$f"
    cp "$src" "$BIZDEV_MIRROR_DIR/$f"
    echo "✓ $f を同期しました"
done

echo ""
echo "完了。次にやること:"
echo "  git add -A && git commit -m \"清掃ルール更新\" && git push"
echo "  → Vercel ビルドで本番反映"
