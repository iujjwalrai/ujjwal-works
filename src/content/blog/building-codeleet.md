---
title: Building an Online Judge from Scratch
excerpt: Lessons from designing a scalable code execution platform with Docker, Redis, and BullMQ.
date: 2026-09-15
tags: [docker, redis, system-design]
---

When I set out to build CodeLeet, I wanted to understand what goes on behind the curtain of platforms like LeetCode and Codeforces. The challenge wasn't just "run some code and check the output" — it was doing it safely, at scale, without letting someone's infinite loop take down your server.

## The Architecture

The core idea is simple: a user submits code, we run it in an isolated environment, and return the result. But the devil is in the details.

I went with a job queue architecture. When a submission comes in, it doesn't get executed immediately. Instead, it gets pushed to a **Redis-backed BullMQ queue**. Worker processes pick up jobs from the queue and spin up Docker containers to execute the code.

### Why Docker?

Each submission runs inside its own Docker container with enforced CPU and memory limits. This means:

- A user can't consume all your server's RAM with a memory leak
- Infinite loops get killed after a timeout
- One user's submission can't interfere with another's

### The Queue Matters

Without the queue, you'd have a classic thundering herd problem. During peak usage, 1,000+ submissions could arrive simultaneously. BullMQ handles this gracefully — workers process jobs at their own pace, and users see their submission status update in real-time via WebSockets.

## What I Learned

The biggest lesson was that **non-blocking I/O is everything** in Node.js. Early on, I made the mistake of awaiting Docker execution synchronously in the API handler. Response times were terrible. Moving to background job processing improved throughput dramatically.

Real-time result streaming via WebSockets was another game-changer — it reduced perceived latency by about 60% because users could see partial results as they came in.

## What's Next

I'm exploring adding support for multiple languages beyond the current set, and looking into Kubernetes for orchestrating the execution containers at larger scale. The current setup handles the load well, but there's always room to grow.
