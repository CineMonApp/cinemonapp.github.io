#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$PWD/node_modules/.bin:$PATH"
preview_dir="$(mktemp -d "${TMPDIR:-/tmp}/cinemon-preview.XXXXXX")"
trap 'rm -rf "$preview_dir"' EXIT
hugo server --bind 0.0.0.0 --port 8766 --baseURL http://localhost:8766/ --destination "$preview_dir" --disableFastRender "$@"
