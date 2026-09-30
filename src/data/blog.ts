export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  tags: string[];
  draft: boolean;
}

// Every .md file in src/content/blog is a post; the filename is its URL slug.
// Posts are bundled at build time, so publishing = commit + push.
const files = import.meta.glob<string>('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { data, body: match[2].trim() };
}

function parseTags(value = ''): string[] {
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

const posts: BlogPost[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw);
    const id = path.split('/').pop()!.replace(/\.md$/, '');
    return {
      id,
      title: data.title || id,
      excerpt: data.excerpt || body.slice(0, 120) + '...',
      body,
      date: data.date || '1970-01-01',
      tags: parseTags(data.tags),
      draft: data.draft === 'true',
    };
  })
  // Drafts are visible in `npm run dev` only.
  .filter((post) => import.meta.env.DEV || !post.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

export function getBlogPosts(): BlogPost[] {
  return posts;
}

export function getBlogPost(id: string): BlogPost | undefined {
  return posts.find((p) => p.id === id);
}

// Dates are plain YYYY-MM-DD; format in UTC so visitors west of UTC
// don't see the previous day.
export function formatPostDate(dateStr: string, month: 'short' | 'long' = 'short'): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
