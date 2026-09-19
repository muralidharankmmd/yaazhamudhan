export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let id: string | null = null;

    if (parsed.hostname === "youtu.be") {
      id = parsed.pathname.slice(1);
    } else if (parsed.hostname.endsWith("youtube.com")) {
      id = parsed.searchParams.get("v") ?? parsed.pathname.split("/embed/")[1] ?? null;
    }

    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
