// Publish a draft: npm run publish-post -- <slug>   (no slug = list drafts)
// Flips draft → false, stamps today's date, checks the site builds, then commits and pushes that post.
// Pass --no-push to commit without pushing.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../src/content/blog/', import.meta.url));
const args = process.argv.slice(2);
const noPush = args.includes('--no-push');
const slug = args.find((a) => !a.startsWith('--'))?.replace(/\.md$/, '');

const isDraft = (text) => /^draft:[ \t]*true[ \t]*$/m.test(text.split(/^---\s*$/m)[1] ?? '');

if (!slug) {
  const drafts = readdirSync(dir).filter((f) => f.endsWith('.md') && isDraft(readFileSync(dir + f, 'utf8')));
  if (drafts.length === 0) {
    console.log('No drafts. Start one with: npm run new-post -- "My Post Title"');
  } else {
    console.log('Drafts:\n' + drafts.map((f) => `  ${f.replace(/\.md$/, '')}`).join('\n'));
    console.log('\nPublish one with: npm run publish-post -- <slug>');
  }
  process.exit(0);
}

const rel = `src/content/blog/${slug}.md`;
const file = dir + `${slug}.md`;
if (!existsSync(file)) {
  console.error(`Not found: ${rel}`);
  process.exit(1);
}

const original = readFileSync(file, 'utf8');
const match = original.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!match) {
  console.error(`${rel} has no frontmatter block.`);
  process.exit(1);
}

const title = match[1].match(/^title:[ \t]*(\S.*)$/m)?.[1].trim();
if (!title) {
  console.error(`${rel} needs a title.`);
  process.exit(1);
}
if (!/^excerpt:[ \t]*\S/m.test(match[1])) {
  console.warn('Note: no excerpt set — the list will show the first 120 characters of the post.');
}

const today = new Date().toISOString().slice(0, 10);
const frontmatter = match[1]
  .replace(/^draft:.*\r?\n?/m, '')
  .replace(/^date:.*$/m, `date: ${today}`)
  .trimEnd();
const updated = original.replace(match[0], `---\n${frontmatter}\n---`);

const run = (cmd, cmdArgs) => execFileSync(cmd, cmdArgs, { stdio: 'inherit' });

writeFileSync(file, updated);
try {
  console.log('Checking the site builds…');
  run('npm', ['run', 'build', '--silent']);
} catch {
  writeFileSync(file, original);
  console.error('\nBuild failed — post left as a draft. Fix the error above and try again.');
  process.exit(1);
}

run('git', ['add', rel]);
run('git', ['commit', '-m', `Post: ${title}`, '--', rel]);
if (noPush) {
  console.log(`\nCommitted "${title}" (not pushed).`);
} else {
  run('git', ['push']);
  console.log(`\nPublished "${title}" → /blog/${slug}`);
}
