// Profile content shared by the home page and the interactive shell.

export const WHOAMI =
  'Software engineer who enjoys the unglamorous parts — queues, databases, and the plumbing that keeps production quiet at 2am.';
export const NOW = 'Currently building backend features with Django, Python and AWS.';

export const KLYSTR = {
  name: 'Klystr',
  kind: 'A miniature Kubernetes',
  description: 'A container orchestrator built from the ground up — Kubernetes, but small enough to fit in your head.',
};

export const projects = [
  {
    name: 'CodeLeet',
    kind: 'Online judge & DSA practice platform',
    description:
      'Docker-sandboxed code execution with enforced CPU and memory limits, Redis + BullMQ for async job processing, and results streamed back over WebSockets.',
    stats: [
      { value: '1,000+', label: 'concurrent submissions' },
      { value: '60%', label: 'lower perceived latency' },
    ],
    stack: ['React', 'Node.js', 'Docker', 'Redis', 'BullMQ', 'WebSockets', 'MongoDB'],
  },
  {
    name: 'ASCT',
    kind: 'Advocates Self Care Team — donation platform',
    description:
      'Full-stack donation platform with Razorpay payments, a Gemini-powered chatbot, real-time chat over Socket.io, and donation verification and grievance workflows.',
    stats: [
      { value: '100+', label: 'advocates served' },
    ],
    stack: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'Razorpay', 'Cloudinary'],
  },
];

export const stack = [
  { key: 'languages', items: ['Java', 'JavaScript', 'Python', 'C', 'SQL'] },
  { key: 'frameworks', items: ['React', 'Node.js', 'Express', 'Django'] },
  { key: 'databases', items: ['MongoDB', 'PostgreSQL', 'Redis'] },
  { key: 'tooling', items: ['Docker', 'Git', 'AWS', 'Linux', 'WebSockets', 'REST APIs'] },
];

export const highlights = [
  { value: '2nd', title: 'DevQuest Hackathon, IIT Jodhpur', note: 'AI-powered Ayurvedic remedy app with OpenAI image analysis.' },
  { value: 'Top 10', title: 'Execute Hackathon, DTU', note: 'Out of 300+ competing teams.' },
  { value: '800+', title: 'DSA problems solved', note: 'Across LeetCode, CodeChef and Codeforces.' },
  { value: '1802', title: 'Peak LeetCode rating', note: 'CodeChef 1619 · Codeforces 1213.' },
  { value: 'Top 2%', title: 'JEE Main', note: 'Percentile, nationwide.' },
];
