# yaazhamudhan.com

Photos, videos, and milestones — built with [Astro](https://astro.build).

## Run it locally

```sh
npm install
npm run dev
```

Then open http://localhost:4321

## Adding a new photo, video, or achievement

Everything on the site is a "moment" — a folder under `src/content/moments/`.
To add one:

1. Create a new folder: `src/content/moments/<some-short-slug>/`
2. Add an `index.md` file inside it:

   ```md
   ---
   title: "Title shown on the site"
   date: 2026-09-19
   type: achievement   # or "photo" or "milestone"
   featured: true       # optional
   description: "One-sentence summary shown on the card."
   cover: ./cover.jpg          # optional, put the image file in this folder
   gallery:
     - ./photo-1.jpg           # optional, more images in this folder
     - ./photo-2.jpg
   videos:
     - /videos/<some-short-slug>/clip.mp4   # optional, see below
   ---

   Longer story goes here in Markdown.
   ```

3. **Photos** referenced in `cover`/`gallery` go directly in the same folder as
   `index.md`. Astro automatically resizes/optimizes them at build time.
4. **Videos** are self-hosted and are NOT optimized, so:
   - Put the file under `public/videos/<some-short-slug>/clip.mp4`
   - Reference it with an absolute path: `/videos/<some-short-slug>/clip.mp4`
   - Compress before adding — a phone video re-exported around 1080p/H.264
     is usually small enough. Avoid raw 4K exports; they bloat the Git repo
     and slow down cloning/deploys. If a single video needs to be over
     ~50MB, use [Git LFS](https://git-lfs.com/) for the `public/videos/`
     folder instead of committing it directly.
5. Commit and push — the live site rebuilds and redeploys automatically.

That's the entire workflow: no admin panel, no database — just files in Git.

## Deployment

This is a fully static site (`npm run build` outputs plain HTML/CSS/JS/assets
to `dist/`), so it can be hosted for free on Vercel, Netlify, or Cloudflare
Pages, pointed at the `yaazhamudhan.com` domain.
