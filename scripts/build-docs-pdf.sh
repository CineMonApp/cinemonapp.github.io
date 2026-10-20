#!/usr/bin/env bash
#
# Build a single PDF of the whole CineMon documentation site.
#
#   ./scripts/build-docs-pdf.sh              -> dist/CineMon-Documentation.pdf
#   ./scripts/build-docs-pdf.sh -o out.pdf   -> custom output path
#   ./scripts/build-docs-pdf.sh --dated      -> dist/CineMon-Documentation-YYYY-MM-DD.pdf
#   ./scripts/build-docs-pdf.sh --no-images  -> text only, screenshots suppressed
#   ./scripts/build-docs-pdf.sh --images     -> keep screenshots (the default)
#   ./scripts/build-docs-pdf.sh --keep-html  -> also keep the intermediate HTML
#
# Every docs page is included, in sidebar order (weight), depth-first, with a
# cover, a table of contents carrying real page numbers, running headers, and
# a PDF bookmark tree that mirrors the site navigation.
#
# --no-images keeps the cover logo but drops every screenshot, diagram and
# badge, which produces a much smaller, text-focused reference. The default
# output filename gains a "-text" suffix so the two variants never collide.
#
# Requires: hugo (extended), weasyprint  ->  brew install weasyprint
#
# NOTE: builds into a temp directory, never ./public, so this is safe to run
# while `hugo server` is up. See README.md.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
export PATH="$REPO_ROOT/node_modules/.bin:$PATH"

OUT=""
DATED=0
KEEP_HTML=0
IMAGES=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)             OUT="$2"; shift 2 ;;
    --dated)                 DATED=1; shift ;;
    --no-images|--text-only) IMAGES=0; shift ;;
    --images)                IMAGES=1; shift ;;
    --keep-html)             KEEP_HTML=1; shift ;;
    -h|--help)    sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------- preflight
for bin in hugo weasyprint; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "error: '$bin' not found." >&2
    [[ "$bin" == "weasyprint" ]] && echo "        install it with:  brew install weasyprint" >&2
    exit 1
  fi
done

# A "-text" suffix keeps the illustrated and text-only builds side by side
# instead of overwriting each other. An explicit -o always wins.
SUFFIX=""
[[ $IMAGES -eq 0 ]] && SUFFIX="-text"
if [[ -z "$OUT" ]]; then
  if [[ $DATED -eq 1 ]]; then
    OUT="dist/CineMon-Documentation${SUFFIX}-$(date +%Y-%m-%d).pdf"
  else
    OUT="dist/CineMon-Documentation${SUFFIX}.pdf"
  fi
fi
mkdir -p "$(dirname "$OUT")"

BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/cinemon-pdf.XXXXXX")"
cleanup() { [[ $KEEP_HTML -eq 1 ]] || rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

# ------------------------------------------------------------------- render
# The print config overlay adds the `print` output format and relative URLs so
# WeasyPrint resolves images and CSS straight off disk. hugo.yaml is untouched,
# so /print.html is never part of a production deploy.
echo "==> Rendering docs to a single HTML page"
hugo \
  --quiet \
  --config hugo.yaml,scripts/pdf/config-pdf.yaml \
  --destination "$BUILD_DIR" \
  --baseURL "/" \
  --cleanDestinationDir

PRINT_HTML="$BUILD_DIR/print.html"
if [[ ! -f "$PRINT_HTML" ]]; then
  echo "error: expected $PRINT_HTML to exist after the Hugo build." >&2
  exit 1
fi

PAGES_IN=$(grep -c 'class="doc doc-l' "$PRINT_HTML" || true)
echo "    ${PAGES_IN} documentation pages collected"

# ---------------------------------------------------------------------- pdf
# -q keeps the run quiet; missing screenshot assets are warnings, not errors,
# so a page whose screenshot has not been captured yet still typesets.
# -s loads a *user* stylesheet, which is why no-images.css uses !important:
# it has to outrank both print.css and the inline sizing on each <img>.
WP_ARGS=()
if [[ $IMAGES -eq 0 ]]; then
  WP_ARGS+=(-s "scripts/pdf/no-images.css")
  echo "==> Typesetting PDF (text only, images suppressed)"
else
  echo "==> Typesetting PDF"
fi

weasyprint \
  --encoding utf-8 \
  --base-url "$BUILD_DIR/" \
  ${WP_ARGS[@]+"${WP_ARGS[@]}"} \
  "$PRINT_HTML" \
  "$OUT" \
  2> >(grep -v -e 'WARNING: Failed to load image' -e 'is not a valid ' >&2 || true)

if [[ $KEEP_HTML -eq 1 ]]; then
  cp "$PRINT_HTML" "$(dirname "$OUT")/print.html"
  echo "    kept intermediate HTML at $(dirname "$OUT")/print.html"
fi

SIZE=$(du -h "$OUT" | cut -f1 | tr -d ' ')
# WeasyPrint writes cross-reference streams, so the page count is not greppable
# out of the raw file. Spotlight reads it correctly on macOS; elsewhere we just
# omit it rather than print something wrong.
# WeasyPrint writes fully-compressed object streams, so the page count is not
# greppable out of the file. Spotlight reads it correctly once the fresh file is
# indexed; elsewhere we omit the count rather than print something wrong.
PDF_PAGES=""
if command -v mdls >/dev/null 2>&1; then
  command -v mdimport >/dev/null 2>&1 && mdimport "$OUT" 2>/dev/null || true
  PDF_PAGES=$(mdls -name kMDItemNumberOfPages -raw "$OUT" 2>/dev/null || true)
  [[ "$PDF_PAGES" == "(null)" || ! "$PDF_PAGES" =~ ^[0-9]+$ ]] && PDF_PAGES=""
fi
echo "==> Done: $OUT  (${SIZE}${PDF_PAGES:+, ${PDF_PAGES} pages})"
