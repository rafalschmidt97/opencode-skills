#!/usr/bin/env bash
# Install opencode-skills: register skill repo + symlink plugins
# Usage: git clone https://github.com/rafalschmidt97/opencode-skills.git && cd opencode-skills && ./install.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGINS_DIR="${HOME}/.config/opencode/plugins"

echo "Installing opencode-skills..."

# Symlink plugins
mkdir -p "$PLUGINS_DIR"
for plugin_dir in "$SCRIPT_DIR"/plugins/*/; do
  [ -d "$plugin_dir" ] || continue
  plugin_name="$(basename "$plugin_dir")"
  for file in "$plugin_dir"*.ts "$plugin_dir"*.js; do
    [ -f "$file" ] || continue
    filename="$(basename "$file")"
    target="${PLUGINS_DIR}/${filename}"
    if [ -L "$target" ]; then
      rm "$target"
    elif [ -f "$target" ]; then
      echo "Warning: ${target} exists and is not a symlink. Skipping (back up and remove to install)."
      continue
    fi
    ln -s "$file" "$target"
    echo "  Linked plugin: ${filename}"
  done
done

echo ""
echo "Done! Plugins symlinked to ${PLUGINS_DIR}."
echo ""
echo "To register as an OpenCode skill repo, use the install-skill-repo skill"
echo "or add this repo path to your OpenCode configuration."
