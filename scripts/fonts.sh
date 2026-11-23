#!/bin/sh
# Subsets M PLUS Rounded 1c to the characters the site uses (content + ASCII) and writes WOFF2 to public/fonts/.
# Needs fonttools in .venv (python3 -m venv .venv && .venv/bin/pip install fonttools brotli). Rerun after changing text.
set -eu
cd "$(dirname "$0")/.."
# M PLUS Rounded 1c（OFL）の TTF があるフォルダ: https://fonts.google.com/specimen/M+PLUS+Rounded+1c
src="${FONT_DIR:?set FONT_DIR to the folder with MPLUSRounded1c-*.ttf}"
mkdir -p public/fonts
chars=$(mktemp)
cat src/content/*.ts src/components/*.astro src/pages/*.astro 2>/dev/null > "$chars"
printf ' !"#$%%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~…—–·•●✓?−×←→↑↓“”‘’「」（）、。！？' >> "$chars"
for w in Bold:700 ExtraBold:800 Black:900; do
  .venv/bin/pyftsubset "$src/MPLUSRounded1c-${w%%:*}.ttf" --text-file="$chars" --flavor=woff2 \
    --layout-features='*' --output-file="public/fonts/rounded-${w##*:}.woff2"
done
rm "$chars"
ls -l public/fonts
