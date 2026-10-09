import { getBlogPosts, formatPostDate } from '../data/blog';
import { KLYSTR, NOW, WHOAMI, projects, stack } from '../data/profile';
import { EMAIL, GITHUB, LINKEDIN, SOURCE } from '../data/site';

export type LineKind = 'cmd' | 'out' | 'dim' | 'ok' | 'err' | 'accent';

export interface ShellContext {
  /** Directory the prompt shows, derived from the current route (e.g. "~/blog"). */
  cwd: string;
  theme: 'light' | 'dark';
  print: (text: string, kind?: LineKind) => void;
  clear: () => void;
  close: () => void;
  /** Route change through the page transition. */
  go: (to: string) => void;
  /** Scroll to a home-page section, navigating home first if needed. */
  section: (id: string) => void;
  toggleTheme: () => void;
  copyEmail: () => void;
  history: () => string[];
  later: (ms: number, fn: () => void) => void;
}

// ─── The site as a tiny filesystem ───

interface FileNode {
  kind: 'file';
  read: () => string[];
  /** Where `open` takes you. */
  href?: string;
}

interface DirNode {
  kind: 'dir';
  /** Page route, or a home section (prefixed with #), that `cd` takes you to. */
  target: string;
}

type Node = FileNode | DirNode;

const slug = (name: string) => name.toLowerCase();

function buildTree(): Map<string, Node> {
  const tree = new Map<string, Node>();
  tree.set('~', { kind: 'dir', target: '/' });
  tree.set('~/blog', { kind: 'dir', target: '/blog' });
  tree.set('~/projects', { kind: 'dir', target: '#projects' });
  tree.set('~/contact', { kind: 'dir', target: '/contact' });

  tree.set('~/about.txt', { kind: 'file', read: () => [WHOAMI] });
  tree.set('~/now.txt', { kind: 'file', read: () => [NOW] });
  tree.set('~/skills.txt', {
    kind: 'file',
    read: () => stack.map((row) => `${row.key.padEnd(11)} ${row.items.join(', ')}`),
  });
  tree.set('~/links.txt', {
    kind: 'file',
    read: () => [`email     ${EMAIL}`, `github    ${GITHUB}`, `linkedin  ${LINKEDIN}`, `source    ${SOURCE}`],
  });

  for (const post of getBlogPosts()) {
    tree.set(`~/blog/${post.id}.md`, {
      kind: 'file',
      href: `/blog/${post.id}`,
      read: () => [`# ${post.title}`, `${formatPostDate(post.date, 'long')} · ${post.tags.join(', ')}`, '', post.excerpt],
    });
  }

  const all = [{ ...KLYSTR, stack: [] as string[], stats: [] as { value: string; label: string }[] }, ...projects];
  for (const p of all) {
    tree.set(`~/projects/${slug(p.name)}.md`, {
      kind: 'file',
      href: p.name === KLYSTR.name ? '#klystr' : '#projects',
      read: () => [
        `# ${p.name} — ${p.kind}`,
        '',
        p.description,
        ...(p.stats.length ? ['', p.stats.map((s) => `${s.value} ${s.label}`).join(' · ')] : []),
        ...(p.stack.length ? [p.stack.join(' / ')] : []),
      ],
    });
  }
  return tree;
}

/** Turns "../blog/", "~/projects", "post.md" etc. into an absolute "~/..." path. */
function resolve(arg: string, cwd: string): string {
  const parts = arg.startsWith('~') || arg.startsWith('/') ? [] : cwd.split('/').slice(1);
  for (const seg of arg.replace(/^~\/?|^\//, '').split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return ['~', ...parts].join('/');
}

function children(tree: Map<string, Node>, dir: string): string[] {
  return [...tree.keys()]
    .filter((p) => p !== dir && p.startsWith(`${dir}/`) && !p.slice(dir.length + 1).includes('/'))
    .map((p) => p.slice(dir.length + 1) + (tree.get(p)!.kind === 'dir' ? '/' : ''))
    .sort();
}

// Edit distance where swapping two adjacent letters counts as one edit ("sl" → "ls"),
// for "did you mean".
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

const SECTIONS = ['experience', 'education', 'projects', 'klystr', 'stack', 'highlights'];

// ─── Commands ───

type Command = (args: string[], ctx: ShellContext, tree: Map<string, Node>) => void;

const HELP: [string, string][] = [
  ['ls [dir]', 'list files'],
  ['cd <dir>', 'go to a page (blog, contact, ~) or section (projects…)'],
  ['cat <file>', 'print a file — try about.txt'],
  ['open <file|github|linkedin|source>', 'open a post, or a link'],
  ['whoami · pwd · date · history', 'the usual'],
  ['theme [dark|light]', 'switch colour theme'],
  ['email', 'copy my email address'],
  ['clear · exit', 'tidy up / close (or press Esc)'],
];

const commands: Record<string, Command> = {
  help(_, ctx) {
    ctx.print('Available commands:', 'dim');
    for (const [cmd, what] of HELP) ctx.print(`  ${cmd.padEnd(36)}${what}`);
    ctx.print('Tab completes, ↑/↓ walks history. There may be a sudo command or two.', 'dim');
  },

  ls(args, ctx, tree) {
    const target = resolve(args[0] ?? '.', ctx.cwd);
    const node = tree.get(target);
    if (!node) return ctx.print(`ls: ${args[0]}: No such file or directory`, 'err');
    if (node.kind === 'file') return ctx.print(target.split('/').pop()!);
    const items = children(tree, target);
    if (target === '~/contact') return ctx.print('(a form lives here — cd contact to use it)', 'dim');
    ctx.print(items.join('  ') || '(empty)', 'accent');
  },

  cd(args, ctx, tree) {
    const arg = args[0] ?? '~';
    const id = arg.replace(/^#/, '').toLowerCase();
    if (SECTIONS.includes(id) || id === 'skills') {
      ctx.close();
      ctx.section(id === 'skills' ? 'stack' : id);
      return;
    }
    const target = resolve(arg, ctx.cwd);
    const node = tree.get(target);
    if (!node) return ctx.print(`cd: no such file or directory: ${arg}`, 'err');
    if (node.kind === 'file') return ctx.print(`cd: not a directory: ${arg}`, 'err');
    if (node.target.startsWith('#')) {
      ctx.close();
      ctx.section(node.target.slice(1));
    } else if (target !== ctx.cwd) {
      ctx.close();
      ctx.go(node.target);
    }
  },

  pwd(_, ctx) {
    ctx.print(ctx.cwd.replace('~', '/home/ujjwal'));
  },

  cat(args, ctx, tree) {
    if (!args.length) return ctx.print('usage: cat <file>', 'err');
    for (const arg of args) {
      const node = tree.get(resolve(arg, ctx.cwd));
      if (!node) ctx.print(`cat: ${arg}: No such file or directory`, 'err');
      else if (node.kind === 'dir') ctx.print(`cat: ${arg}: Is a directory`, 'err');
      else {
        for (const line of node.read()) ctx.print(line);
        if (node.href?.startsWith('/')) ctx.print(`→ open ${arg} to read the whole thing`, 'dim');
      }
    }
  },

  open(args, ctx, tree) {
    const arg = args[0];
    const links: Record<string, string> = { github: GITHUB, linkedin: LINKEDIN, source: SOURCE };
    if (!arg) return ctx.print('usage: open <file|github|linkedin|source>', 'err');
    if (links[arg]) {
      window.open(links[arg], '_blank', 'noopener,noreferrer');
      return ctx.print(`opened ${links[arg]}`, 'ok');
    }
    const node = tree.get(resolve(arg, ctx.cwd));
    if (!node) return ctx.print(`open: ${arg}: No such file or directory`, 'err');
    const href = node.kind === 'dir' ? node.target : node.href;
    if (!href) return commands.cat([arg], ctx, tree);
    ctx.close();
    if (href.startsWith('#')) ctx.section(href.slice(1));
    else ctx.go(href);
  },

  whoami(_, ctx) {
    ctx.print(WHOAMI);
  },

  date(_, ctx) {
    const now = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });
    ctx.print(`${now} IST`);
  },

  echo(args, ctx) {
    ctx.print(args.join(' '));
  },

  history(_, ctx) {
    ctx.history().forEach((cmd, i) => ctx.print(`${String(i + 1).padStart(4)}  ${cmd}`));
  },

  theme(args, ctx) {
    const want = args[0];
    if (want && want !== 'dark' && want !== 'light') return ctx.print('usage: theme [dark|light]', 'err');
    if (want === ctx.theme) return ctx.print(`already ${want}`, 'dim');
    ctx.toggleTheme();
    ctx.print(`theme → ${ctx.theme === 'dark' ? 'light' : 'dark'}`, 'ok');
  },

  email(_, ctx) {
    ctx.copyEmail();
    ctx.print(`${EMAIL} — copied to clipboard`, 'ok');
  },

  sudo(args, ctx) {
    if (args.join(' ') !== 'hire-me') {
      return ctx.print('ujjwal is not in the sudoers file. This incident will be reported.', 'err');
    }
    ctx.print('[sudo] password for recruiter:', 'dim');
    ctx.later(700, () => ctx.print('••••••••', 'dim'));
    ctx.later(1300, () => ctx.print('✓ access granted — drafting an email to ujjwal…', 'ok'));
    ctx.later(1900, () => {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's talk")}`;
    });
  },

  rm(args, ctx) {
    if (args.some((a) => a.startsWith('-') && a.includes('r'))) {
      return ctx.print("rm: refusing to delete production. It's 2am somewhere.", 'err');
    }
    ctx.print('rm: this filesystem is read-only', 'err');
  },

  vim(_, ctx) {
    ctx.print("You're in vim now. Good luck. (Just kidding — this is a portfolio.)", 'dim');
  },

  clear(_, ctx) {
    ctx.clear();
  },

  exit(_, ctx) {
    ctx.close();
  },
};
commands.nano = commands.vim;
commands.emacs = commands.vim;
commands.cls = commands.clear;

export const COMMAND_NAMES = Object.keys(commands).sort();

export function run(input: string, ctx: ShellContext) {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return;
  const cmd = commands[name];
  if (cmd) return cmd(args, ctx, buildTree());

  ctx.print(`zsh: command not found: ${name}`, 'err');
  const best = COMMAND_NAMES.map((c) => [c, distance(name, c)] as const).sort((a, b) => a[1] - b[1])[0];
  if (best && best[1] <= 2) ctx.print(`did you mean: ${best[0]}?`, 'dim');
  else ctx.print('type help to see what works', 'dim');
}

/** Tab completion. Returns the new input, plus the candidates when it's ambiguous. */
export function complete(input: string, cwd: string): { value: string; options: string[] } {
  const words = input.split(' ');
  const last = words[words.length - 1];

  let candidates: string[];
  let prefix = '';
  if (words.length === 1) {
    candidates = COMMAND_NAMES;
  } else {
    // Complete the last path segment against the directory it points into.
    const slash = last.lastIndexOf('/');
    prefix = slash === -1 ? '' : last.slice(0, slash + 1);
    const dir = resolve(prefix || '.', cwd);
    candidates = children(buildTree(), dir);
    if (words[0] === 'open' && !prefix) candidates = [...candidates, 'github', 'linkedin', 'source'];
    if (words[0] === 'theme') candidates = ['dark', 'light'];
  }

  const stem = last.slice(prefix.length);
  const matches = candidates.filter((c) => c.startsWith(stem));
  if (matches.length === 0) return { value: input, options: [] };

  // Extend to the longest common prefix of all matches.
  let common = matches[0];
  for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
  const done = matches.length === 1 && !common.endsWith('/');
  words[words.length - 1] = prefix + common + (done ? ' ' : '');
  return { value: words.join(' '), options: matches.length > 1 ? matches : [] };
}

/** "~" style directory for a route, shown in the prompt. */
export function cwdFor(pathname: string): string {
  if (pathname.startsWith('/blog')) return '~/blog';
  if (pathname.startsWith('/contact')) return '~/contact';
  return '~';
}
