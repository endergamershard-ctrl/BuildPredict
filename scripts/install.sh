#!/usr/bin/env bash
# Install the latest BuildPredict release on Linux (x86_64) or macOS.
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/install.sh | bash
set -euo pipefail

REPO="${BUILDPREDICT_REPO:-endergamershard-ctrl/BuildPredict}"
PREFIX="${BUILDPREDICT_PREFIX:-$HOME/.local}"
BIN_DIR="$PREFIX/bin"
ICON_DIR="$PREFIX/share/icons/hicolor/128x128/apps"
APP_DIR="$PREFIX/share/applications"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

os="$(uname -s)"
arch="$(uname -m)"

for cmd in curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: missing required command: $cmd" >&2
    exit 1
  fi
done

api="https://api.github.com/repos/${REPO}/releases/latest"
echo "Fetching latest release from ${REPO}..."
json="$(curl -fsSL -H 'Accept: application/vnd.github+json' -H 'User-Agent: buildpredict-installer' "$api")"
tag="$(printf '%s\n' "$json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"

if [[ "$os" == "Darwin" ]]; then
  if [[ "$arch" == "arm64" ]]; then
    ASSET_NAME="BuildPredict-macos-aarch64.dmg"
  else
    ASSET_NAME="BuildPredict-macos-x86_64.dmg"
  fi
  asset_url="$(printf '%s\n' "$json" | grep -oE "https://[^\"]+/${ASSET_NAME}" | head -n1)"
  if [[ -z "$asset_url" ]]; then
    echo "error: could not find release asset ${ASSET_NAME}" >&2
    echo "Check https://github.com/${REPO}/releases" >&2
    exit 1
  fi
  echo "Downloading ${tag} (${ASSET_NAME})..."
  curl -fL --progress-bar -o "$TMP_DIR/$ASSET_NAME" "$asset_url"
  mount_point="$(hdiutil attach "$TMP_DIR/$ASSET_NAME" -nobrowse | awk -F'\t' '/\/Volumes\// {print $NF; exit}')"
  if [[ -z "$mount_point" ]]; then
    echo "error: failed to mount DMG" >&2
    exit 1
  fi
  echo "Installing BuildPredict.app to /Applications (may prompt for password)..."
  if [[ -w /Applications ]]; then
    rm -rf "/Applications/BuildPredict.app"
    cp -R "$mount_point/BuildPredict.app" /Applications/
  else
    sudo rm -rf "/Applications/BuildPredict.app"
    sudo cp -R "$mount_point/BuildPredict.app" /Applications/
  fi
  hdiutil detach "$mount_point" -quiet || true
  echo
  echo "Installed BuildPredict ${tag} to /Applications."
  echo "Builds are unsigned: on first launch, right-click BuildPredict.app and choose Open."
  exit 0
fi

if [[ "$os" != "Linux" ]]; then
  echo "error: this installer supports Linux and macOS only (use install.ps1 on Windows)" >&2
  exit 1
fi

if [[ "$arch" != "x86_64" && "$arch" != "amd64" ]]; then
  echo "error: unsupported architecture: $arch (need x86_64)" >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "error: missing required command: tar" >&2
  exit 1
fi

ASSET_NAME="buildpredict-linux-x86_64.tar.gz"
asset_url="$(printf '%s\n' "$json" | grep -oE "https://[^\"]+/${ASSET_NAME}" | head -n1)"

if [[ -z "$asset_url" ]]; then
  echo "error: could not find release asset ${ASSET_NAME}" >&2
  echo "Check https://github.com/${REPO}/releases" >&2
  exit 1
fi

echo "Downloading ${tag} (${ASSET_NAME})..."
curl -fL --progress-bar -o "$TMP_DIR/$ASSET_NAME" "$asset_url"
tar -xzf "$TMP_DIR/$ASSET_NAME" -C "$TMP_DIR"

if [[ ! -f "$TMP_DIR/buildpredict" ]]; then
  echo "error: archive did not contain buildpredict binary" >&2
  exit 1
fi

mkdir -p "$BIN_DIR" "$ICON_DIR" "$APP_DIR"
install -m 755 "$TMP_DIR/buildpredict" "$BIN_DIR/buildpredict"

if [[ -f "$TMP_DIR/buildpredict.png" ]]; then
  install -m 644 "$TMP_DIR/buildpredict.png" "$ICON_DIR/buildpredict.png"
fi

if [[ -f "$TMP_DIR/buildpredict.desktop" ]]; then
  install -m 644 "$TMP_DIR/buildpredict.desktop" "$APP_DIR/buildpredict.desktop"
else
  cat > "$APP_DIR/buildpredict.desktop" <<EOF
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
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$PREFIX/share/icons/hicolor" 2>/dev/null || true
fi

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    echo
    echo "Note: $BIN_DIR is not on your PATH."
    echo "Add this to your shell profile, then open a new terminal:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    ;;
esac

echo
echo "Installed BuildPredict ${tag}"
echo "  Binary:  $BIN_DIR/buildpredict"
echo "  Desktop: $APP_DIR/buildpredict.desktop"
echo
echo "Launch from your app menu or run: buildpredict"
echo "Uninstall: curl -fsSL https://raw.githubusercontent.com/${REPO}/main/scripts/uninstall.sh | bash"
