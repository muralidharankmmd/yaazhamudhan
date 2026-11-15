---
name: yaazhamudhan-dot-com-push
description: Use when adding or updating content (photos, videos, achievements, milestones) on the yaazhamudhan.com site, or when deploying/debugging the site. Covers the Astro content-collection structure, pulling true-original photos/videos from the Photos app, image/video processing conventions, and the git push -> Cloudflare Workers auto-deploy flow.
---

# yaazhamudhan.com — content & deploy

This is a static Astro site (this repo) for a 3.5-year-old's photos, videos,
and milestones. It's built so that adding new content is just: drop files in
a folder, write a short markdown frontmatter, commit, push. No CMS, no
backend, no database.

## Stack recap

- **Framework**: Astro (static output), content lives in a `moments`
  content collection defined in `src/content.config.ts`.
- **Hosting**: Cloudflare Workers (not Pages) — static assets served via
  `wrangler.jsonc` (`assets.directory: ./dist`). Git-connected via
  **Workers Builds**: every push to `main` on GitHub auto-rebuilds and
  redeploys. Build command `npm run build`, deploy command
  `npx wrangler deploy`.
- **Domain**: `yaazhamudhan.com` — DNS is a full Cloudflare zone (nameservers
  delegated away from GoDaddy), with a **Custom Domain** attached to the
  Worker under Workers & Pages → project → Settings → Domains & Routes.
  (Custom Domains on Workers require the zone to live on Cloudflare; a
  CNAME alone at the registrar does not work.)
- **Repo**: GitHub `muralidharankmmd/yaazhamudhan`, `gh` CLI already
  authenticated as that account on this machine.
- **Live dev**: `npx astro dev --background --port 4321` (runs detached;
  `astro dev stop` / `astro dev status` / `astro dev logs` to manage it).
  `npx astro build` to do a full production build locally before pushing.

## Adding a new moment (photo / video / achievement / milestone)

Each moment is a folder: `src/content/moments/<slug>/index.md`, plus any
image files living alongside it in that same folder.

### Frontmatter schema (`src/content.config.ts`)

```yaml
title: string
date: YYYY-MM-DD
type: achievement | photo | milestone   # default: photo
description: string (optional, shown on cards)
cover: ./some-image.jpg                 # optional
gallery: [./a.jpg, ./b.jpg, ...]        # optional, images in this folder
videos: [/videos/<slug>/clip.mp4]       # optional, self-hosted, see below
embeds: [https://youtu.be/XXXX]         # optional, YouTube links -> responsive iframe
links: [{label: "...", url: "https://..."}]  # optional, external citation cards
featured: true|false                    # default false
story: true|false                       # default false, see "story mode" below
```

- **`cover`/`gallery` images** are imported by Astro's image pipeline
  (`image()` in the schema) — they get auto-optimized/resized at build
  time. Always keep the **highest-quality source** in the repo (see
  "Sourcing original photos/videos" below); Astro generates the
  web-sized derivatives, don't pre-shrink originals yourself.
- **`videos`** are plain strings (URLs), not imported — because they're
  self-hosted static files under `public/videos/<slug>/`, served as-is
  with no Astro processing. Keep these H.264/AAC MP4 (see video section)
  and reasonably sized; self-hosting is fine for short clips but prefer
  `embeds` (YouTube) for long-form video (timelapses, multi-minute
  recordings) to avoid bloating the git repo.
- **`embeds`** are rendered as responsive 16:9 iframes via
  `src/lib/youtube.ts` (`getYouTubeEmbedUrl`), using
  `youtube-nocookie.com` for privacy. Only YouTube is wired up today.
- **`links`** render as small pill-shaped cards below the gallery/video —
  use for things like an official record / certificate listing page.

### Story mode (`story: true`)

Setting `story: true` changes how a moment is presented:
- **Homepage**: instead of appearing in the regular card grid, it gets a
  full-width hero slideshow preview (`StoryPreview.astro`) cycling through
  up to 9 `gallery` images, with a "View the full story" link.
- **Its own page**: instead of the normal detail layout, it opens
  `StoryViewer.astro` — a full-page, swipeable, one-item-at-a-time
  viewer. Order is **videos first, then images**, in the order listed in
  frontmatter. Use this for a single big occasion worth walking through
  frame-by-frame (e.g. "the day he was born") rather than routine
  photo/achievement updates, which should stay as regular (non-story)
  moments in the grid.

### Regular (non-story) detail page layout

Cover image → title/date/badge → markdown body (`index.md` content below
the frontmatter) → image gallery grid → self-hosted `<video>` tags →
YouTube `embeds` → `links` cards. This is what most new achievements/
milestones should use.

## Sourcing original photos/videos (do this, every time)

**Never ask the user to manually export/resize/rotate files.** The user
keeps everything in the macOS Photos app and will usually attach only
*preview-resolution* thumbnails in chat (Photos' internal derivatives,
often ~360×480px) — these are NOT the real files and must not be used as
final site assets. Always pull the true originals yourself:

1. Ask the user which **Photos album** holds the relevant items (or check
   with `osxphotos albums` — install via `brew install pipx && pipx
   install osxphotos` if not already present, then
   `export PATH="$HOME/.local/bin:$PATH"`). The user has been naming
   albums for this purpose (e.g. "Birth", "Record") — prefer asking them
   to add/confirm an album over guessing by date.
2. Inspect contents first:
   `osxphotos query --album "<Name>" --json` → check `date`, `width`,
   `height`, filenames — use this to determine true chronological order
   and to spot which items are large videos that should become YouTube
   embeds instead of self-hosted files.
3. Export real originals into a scratch folder (NOT directly into the
   content folder yet):
   `osxphotos export <dest> --album "<Name>" --download-missing --update`
   — add `--only-photos` to skip videos if a video in the album is huge
   and the user says to ignore it. Avoid `--use-photokit` if it hangs;
   plain `--download-missing` (AppleScript-based) worked reliably. This
   can take minutes if iCloud downloads are needed — run it in the
   background / with Monitor rather than blocking, and don't re-prompt
   the user while it's running.
4. **RAW/DNG photos**: convert to JPEG at quality ~95 with
   `sips -s format jpeg -s formatOptions 95 in.DNG --out out.jpg`.
5. **Check and fix rotation.** `sips` does not reliably honor EXIF
   orientation tags — always `Read` the converted image back and
   visually verify orientation before trusting it. If sideways, test
   `sips --rotate 90` (or 270) on one file, re-check visually, then
   apply the same rotation across the whole batch. Spot-check at least
   2-3 images across the batch, not just the first one, since not all
   shots in a set necessarily share the same orientation metadata.
6. **Order chronologically** using the `date` field from step 2, renaming
   into the content folder as `01.jpg`, `02.jpg`, etc. in that order
   unless the user asks for a different order.
7. **Videos meant to be self-hosted**: check codec first with `ffprobe`
   (`brew install ffmpeg` if missing). iPhone videos are often HEVC/H.265
   4K, which Chrome/Firefox/Windows can't play — transcode with:
   `ffmpeg -i in.mov -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p
   -c:a aac -b:a 192k -movflags +faststart out.mp4`
   then place under `public/videos/<slug>/`. This is visually-lossless
   (crf 16) while being broadly compatible.
8. **Videos too large/long to self-host** (the user has called out
   multi-hour recordings as "heavyweight"): skip transcoding them
   entirely; instead the user uploads to YouTube (unlisted is fine) and
   gives a share link — wire that into `embeds`, not `videos`.
9. Copy only the final chosen files into
   `src/content/moments/<slug>/`, then **delete the scratch/export
   staging folder** (it will contain multiple giant intermediate formats
   — RAW, uncompressed, etc. — easily 1GB+, and must never be committed).
10. Update `index.md` frontmatter to reference the final files, then
    `npx astro build` locally to confirm it compiles before pushing.

## Verifying before push

1. `npx astro build` — must complete without errors. Watch the image
   optimization step output: original multi-MB photos should shrink to
   tens/hundreds of KB per derivative (AVIF for story viewer, WebP for
   grid/previews) — if a build suddenly takes much longer or produces
   much larger files than past runs, something (e.g. an accidentally
   huge unprocessed asset) is off.
2. If something changed in `src/content.config.ts` or other config and
   dev server throws stale errors, clear the cache:
   `npx astro dev stop && rm -rf .astro node_modules/.astro && npx astro
   dev --background --port 4321`.
3. Load the relevant page(s) and actually look at them (screenshots or
   open in browser) before pushing — especially new media (orientation,
   cropping, slideshow pacing) — rather than trusting a successful build
   alone.

## Committing and pushing

- Stage specific files/folders, not blanket `git add -A` without a
  `git status` review first — new content folders bring in large binary
  photos/videos and it's easy to accidentally also sweep in a leftover
  scratch/export folder (see step 9 above) if cleanup was missed.
- Write commit messages that describe the content added (what moment,
  what's now true/correct about it) rather than the mechanics.
- `git push` to `main` — Cloudflare Workers Builds picks this up
  automatically and redeploys yaazhamudhan.com within a minute or two.
  No separate manual deploy step is needed.

## Known one-time setup already done (don't redo)

- `gh auth login` already completed for `muralidharankmmd` on this
  machine.
- Cloudflare zone for `yaazhamudhan.com` is live, nameservers delegated
  from GoDaddy, Custom Domain attached to the `yaazhamudhan` Worker.
- `wrangler.jsonc` and the `wrangler` devDependency are committed;
  Workers Builds is connected to the GitHub repo with build command
  `npm run build` / deploy command `npx wrangler deploy`.
