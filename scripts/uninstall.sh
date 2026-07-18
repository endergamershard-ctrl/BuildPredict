#!/usr/bin/env bash
# Uninstall BuildPredict on Linux or macOS.
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/endergamershard-ctrl/BuildPredict/main/scripts/uninstall.sh | bash
set -euo pipefail

os="$(uname -s)"

if [[ "$os" == "Darwin" ]]; then
  if [[ -d "/Applications/BuildPredict.app" ]]; then
    if [[ -w /Applications ]]; then
      rm -rf "/Applications/BuildPredict.app"
    else
      sudo rm -rf "/Applications/BuildPredict.app"
    fi
    echo "Removed /Applications/BuildPredict.app"
  else
    echo "BuildPredict.app not found in /Applications"
  fi
  exit 0
fi

PREFIX="${BUILDPREDICT_PREFIX:-$HOME/.local}"

removed=0
for path in \
  "$PREFIX/bin/buildpredict" \
  "$PREFIX/share/applications/buildpredict.desktop" \
  "$PREFIX/share/icons/hicolor/128x128/apps/buildpredict.png"; do
  if [[ -e "$path" ]]; then
    rm -f "$path"
    echo "Removed $path"
    removed=1
  fi
done

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$PREFIX/share/applications" 2>/dev/null || true
fi

if [[ "$removed" -eq 0 ]]; then
  echo "Nothing to remove — BuildPredict does not appear to be installed under $PREFIX"
else
  echo "BuildPredict uninstalled."
fi
