// Scaffold a new blog post: npm run new-post -- "My Post Title"
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "My Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 60);

const file = fileURLToPath(new URL(`../src/content/blog/${slug}.md`, import.meta.url));
if (existsSync(file)) {
  console.error(`Already exists: src/content/blog/${slug}.md`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
title: ${title}
excerpt:
date: ${today}
tags: []
draft: true
---

Start writing here. Set \`draft: false\` (or delete the line) when it's ready to publish.
`,
);

console.log(`Created src/content/blog/${slug}.md  →  http://localhost:5173/blog/${slug}`);
