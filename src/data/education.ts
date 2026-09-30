export interface Milestone {
  title: string;
  place: string;
  period: string;
  detail?: string;
  /** Commits with a branch name are drawn on a side lane that forks off main. */
  branch?: string;
  /** Git-style decorations: 'HEAD -> main', 'tag: v2027', or a branch name. */
  refs?: string[];
  /** Not reached yet — drawn as a hollow, pulsing node on a dashed line. */
  upcoming?: boolean;
}

// Newest first, like `git log`.
export const education: Milestone[] = [
  {
    title: 'Graduate — B.Tech in Computer Science & Engineering',
    place: 'IIIT Kota',
    period: '2027',
    refs: ['HEAD -> main', 'tag: v2027'],
    upcoming: true,
  },
  {
    title: 'SWE Intern at FischerJordan',
    place: 'Remote — New York',
    period: 'Aug 2026 — present',
    detail: 'Django, PostgreSQL and AWS in production, alongside college.',
    branch: 'internship',
    refs: ['internship'],
  },
  {
    title: 'Started B.Tech in Computer Science & Engineering',
    place: 'Indian Institute of Information Technology, Kota',
    period: '2023 — 2027',
    detail: 'CGPA 7.86. DSA, OS, DBMS, networks, ML — plus 800+ problems solved and a couple of hackathon podiums on the side.',
  },
  {
    title: 'Senior Secondary (CBSE) — 95%',
    place: 'Central Academy, Basti, Uttar Pradesh',
    period: '2023',
    refs: ['root'],
  },
];
