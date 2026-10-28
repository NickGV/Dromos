#!/usr/bin/env bash
# Build the plugin and copy the release artifacts into a local vault so it can
# be tested without BRAT. Override the vault with DROMOS_VAULT=/path/to/vault.
set -euo pipefail

VAULT="${DROMOS_VAULT:-$HOME/Documents/second_brain}"
TARGET="$VAULT/.obsidian/plugins/dromos"

if [ ! -d "$VAULT/.obsidian" ]; then
	echo "No Obsidian vault found at $VAULT (set DROMOS_VAULT)." >&2
	exit 1
fi

npm run build
mkdir -p "$TARGET"
cp main.js manifest.json styles.css "$TARGET/"
echo "Installed into $TARGET. Reload Obsidian or toggle the plugin to pick up the change."
