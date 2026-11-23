# ringomate-site

The website for [RingoMate](https://github.com/sudosanet/ringomate): Astro (static) + a small Cloudflare Worker
(Markdown for agents, `/mcp`) on Workers Static Assets, in English and Japanese.

## Run locally

```sh
pnpm install
node scripts/model.mjs   # Tsukuyomi.vrm from $APPLEMATE_REPO (default ../applemate), textures as WebP -> public/models/ (not in git)

pnpm preview             # astro build + wrangler dev on http://localhost:8787
node scripts/agent-check.mjs   # local stand-in for isitagentready.com
```

- Text lives in `src/content/{en,ja}.ts`. After changing text, rerun `FONT_DIR=<folder with the M PLUS Rounded 1c TTFs> sh scripts/fonts.sh` (subsets it; needs
  `python3 -m venv .venv && .venv/bin/pip install fonttools brotli`).
- `patches/`: three-vrm 3.5.5's WebGPU MToon doesn't build with three r187 (pixiv/three-vrm#1890, #1909). Remove once released.
- The Tsukuyomi-chan model is not redistributed here; see its [terms](https://tyc.rei-yumesaki.net/material/avatar/3d-a/).

## Deploy

```sh
pnpm exec wrangler login   # the Cloudflare account that has the sudosan.net zone
pnpm run deploy            # astro build + wrangler deploy to https://ringomate.sudosan.net
```

`public/models/` must be filled (`node scripts/model.mjs`) before deploying, or the page has no mascot.
