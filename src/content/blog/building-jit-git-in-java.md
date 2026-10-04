---
title: Building Jit: Rewriting Git's Core in Java
excerpt: What I learned by rebuilding Git's object model from scratch in Java, down to producing the exact same hashes as real Git.
date: 2026-10-04
tags: [java, git, systems]
---

I use Git every day, but I didn't really know what it does underneath. So I started building **[Jit](https://github.com/iujjwalrai/Jit)**, a small Git clone written in Java 21 with no dependencies outside the JDK.

My one rule: Jit has to produce **byte-for-byte the same objects as Git**. If the hashes don't match, it's wrong.

```bash
$ jit hash-object -w hello.txt
3b18e512dba79e4c8300dd08aeb37f8e728b8dad

$ git hash-object hello.txt
3b18e512dba79e4c8300dd08aeb37f8e728b8dad
```

## Git is a content-addressed key-value store

Underneath the branches and merges, Git is a folder of compressed files, each named after the SHA-1 hash of its contents. There are only three kinds of objects you need to get started:

- **Blob**: the contents of a file. Just the bytes, not even the filename.
- **Tree**: a directory listing that points to blobs and other trees.
- **Commit**: a pointer to a root tree, plus parents, author, and message.

Every object is stored the same way: a small header, the body, a SHA-1 of both, and zlib compression.

```java
default byte[] serialize() {
    byte[] body = body();
    byte[] header = (type().wireName() + " " + body.length + "\0")
            .getBytes(StandardCharsets.UTF_8);
    byte[] out = new byte[header.length + body.length];
    System.arraycopy(header, 0, out, 0, header.length);
    System.arraycopy(body, 0, out, header.length, body.length);
    return out;
}
```

So `hello world\n` becomes `blob 12\0hello world\n`. That's hashed, and the result `3b18e5...` becomes the path `.jit/objects/3b/18e512...`. The first two hex characters are a folder, which keeps any one directory from getting too big.

## Writing objects safely

Because an object's name *is* its content hash, writing the same thing twice is free: if the file already exists, there's nothing to do. For new objects, Jit writes to a temp file and then does an atomic rename, so a crash never leaves a half-written object behind:

```java
if (Files.exists(target)) return id;   // same content = same id

Path tmp = Files.createTempFile(target.getParent(), "tmp_", null);
try (OutputStream out = new DeflaterOutputStream(Files.newOutputStream(tmp))) {
    out.write(raw);                    // zlib, the format git uses
}
Files.move(tmp, target, StandardCopyOption.ATOMIC_MOVE);
```

## Trees were harder than I expected

Blobs were easy. Trees are where Git's quirks show up.

**The format is binary.** Each entry is `<mode> <name>\0` followed by the object id as **20 raw bytes**, not 40 hex characters. That's why `cat` on a tree object prints garbage.

**The sort order is unusual.** Entries are sorted by raw bytes, but directories sort as if their name ended in `/`. So `src-b` < `src.txt` < `src/`. If you get this wrong, you still get a valid-looking tree, just with a different hash from Git. Nothing errors out; the ids just quietly don't match.

```java
public static final Comparator<TreeEntry> GIT_ORDER =
        (a, b) -> Arrays.compareUnsigned(a.sortKey(), b.sortKey());

private byte[] sortKey() {
    return (isTree() ? name + "/" : name).getBytes(StandardCharsets.UTF_8);
}
```

**Modes are text, but not quite what you'd expect.** Directories are stored as `40000` with no leading zero, even though `ls-tree` displays `040000`.

`write-tree` builds the snapshot bottom-up, because a tree can't be hashed until all of its children have been. It also handles the edge cases Git does: empty directories aren't recorded, symlinks become blobs holding the link target, and executable files get mode `100755`.

The result matches Git exactly:

```bash
$ jit write-tree
3475403c77e936071dc5cf36f25855fb05a44534

$ git write-tree
3475403c77e936071dc5cf36f25855fb05a44534
```

## Commits are just text

After trees, commits felt easy. They're plain text:

```text
tree 3475403c77e936071dc5cf36f25855fb05a44534
author Ujjwal Rai <me@example.com> 1700000000 +0530
committer Ujjwal Rai <me@example.com> 1700000000 +0530

first commit
```

The main detail is the timestamp: seconds since the epoch in UTC, plus the author's own timezone offset written as `+0530` (no colon). That's how `git log` can show a commit in the time it was on the author's clock.

## What Jit can do so far

```text
init         create an empty repository
hash-object  print a file's blob id (-w also stores it)
cat-file     show an object's type, size or content
write-tree   snapshot the working directory as a tree object
ls-tree      list a tree's entries
commit-tree  create a commit object
```

These are Git's "plumbing" commands, the low-level building blocks that the friendly commands like `git commit` are built on.

## What I learned

- **Git's design is simple; its formats are precise.** The model fits on a napkin, but matching it byte for byte means getting every space, NUL byte, and sort rule right.
- **Content addressing gives you a lot for free.** Deduplication, integrity checks, and safe concurrent writes all come from naming things by their hash.
- **Test against the real thing.** Comparing my hashes with `git hash-object` and `git write-tree` caught bugs that unit tests alone would have missed.

## What's next

Next up are refs and `HEAD` so branches work, an index (staging area) so `write-tree` doesn't have to read the whole disk, and then `log`, `status`, and a real `commit` command on top.

The code is on [GitHub](https://github.com/iujjwalrai/Jit) if you want to follow along.
