#!/usr/bin/env bash
# Package the release-built Linux binary into a portable tarball for GitHub Releases.
# Run after: npm run tauri build -- --no-bundle
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/src-tauri/target/release/buildpredict"
OUT_DIR="$ROOT/dist-release"
STAGE="$OUT_DIR/stage"
ARCHIVE="buildpredict-linux-x86_64.tar.gz"

if [[ ! -f "$BIN" ]]; then
  echo "error: $BIN not found — run 'npm run tauri build -- --no-bundle' first" >&2
  exit 1
fi

rm -rf "$OUT_DIR"
mkdir -p "$STAGE"

cp "$BIN" "$STAGE/buildpredict"
cp "$ROOT/src-tauri/icons/128x128.png" "$STAGE/buildpredict.png"

cat > "$STAGE/buildpredict.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=BuildPredict
Comment=PC stats and frame predictor
Exec=buildpredict
Icon=buildpredict
Terminal=false
Categories=Utility;System;
Keywords=pc;build;fps;benchmark;predictor;
StartupNotify=true
EOF

tar -czf "$OUT_DIR/$ARCHIVE" -C "$STAGE" buildpredict buildpredict.png buildpredict.desktop
rm -rf "$STAGE"

echo "Packaged $OUT_DIR/$ARCHIVE"
