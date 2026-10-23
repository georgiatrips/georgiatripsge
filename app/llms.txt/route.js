import { buildSiteBrief } from "../lib/server/siteBrief";

// /llms.txt — a plain-text brief for AI assistants (ChatGPT, Claude,
// Perplexity…), following the llmstxt.org format. It is generated from the
// same data the site renders, so the tours, prices and routes it states are
// the current ones; an assistant quoting it quotes the site.
export const revalidate = 3600;

export async function GET() {
  return new Response(await buildSiteBrief(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
