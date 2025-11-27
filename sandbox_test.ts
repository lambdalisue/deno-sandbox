import { assert, assertEquals, assertRejects } from "@std/assert";
import { existsSync } from "@std/fs/exists";
import { sandbox, sandboxSync } from "./sandbox.ts";

function assertExists(path: string) {
  assert(existsSync(path), `${path} must exist`);
}

function assertNotExists(path: string) {
  assert(!existsSync(path), `${path} must not exist`);
}

Deno.test({
  name:
    "sandbox() creates a sandbox directory and that directory is removed when disposed",
  fn: async () => {
    await using sbox = await sandbox();
    assertExists(sbox.path);

    await sbox[Symbol.asyncDispose]();
    assertNotExists(sbox.path);
  },
});

Deno.test({
  name:
    "sandboxSync() creates a sandbox directory and that directory is removed when disposed",
  fn: () => {
    using sbox = sandboxSync();
    assertExists(sbox.path);

    sbox[Symbol.dispose]();
    assertNotExists(sbox.path);
  },
});

Deno.test({
  name: "Deno.create() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    assertExists(sbox.resolve("foo"));
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.lstat() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.lstat(sbox.resolve("foo"));
    await assertRejects(
      () => Deno.lstat(sbox.resolve("bar")),
      Deno.errors.NotFound,
    );
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.chmod() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.chmod(sbox.resolve("foo"), 0o700);
    const s = await Deno.lstat(sbox.resolve("foo"));
    assertEquals((s.mode ?? 0) & 0o777, 0o700);
  },
});

Deno.test({
  ignore: true, // This test requires a root privilege
  name: "Deno.chown() performs its operation in a sandbox directory",
  fn: async () => {
    const uid = 10000;
    const gid = 10000;
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.chown(sbox.resolve("foo"), uid, gid);
    const s = await Deno.lstat(sbox.resolve("foo"));
    assertEquals(s.uid, uid);
    assertEquals(s.gid, gid);
  },
});

Deno.test({
  name: "Deno.copyFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.copyFile(sbox.resolve("foo"), sbox.resolve("bar"));
    assertExists(sbox.resolve("foo"));
    assertExists(sbox.resolve("bar"));
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.link() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.link(sbox.resolve("foo"), sbox.resolve("bar"));
    assertExists(sbox.resolve("foo"));
    assertExists(sbox.resolve("bar"));
    const s = await Deno.lstat(sbox.resolve("bar"));
    assertEquals(s.isFile, true);
    assertEquals(s.nlink, 2);
  },
});

Deno.test({
  name: "Deno.mkdir() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await Deno.mkdir(sbox.resolve("foo"));
    assertExists(sbox.resolve("foo"));
    const s = await Deno.lstat(sbox.resolve("foo"));
    assertEquals(s.isDirectory, true);
  },
});

Deno.test({
  name: "Deno.open() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await using f = await Deno.open(sbox.resolve("foo"));
    const s = await f.stat();
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.readDir() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _a = await Deno.create(sbox.resolve("alpha"));
    await using _b = await Deno.create(sbox.resolve("beta"));
    await using _c = await Deno.create(sbox.resolve("gamma"));
    const items: Deno.DirEntry[] = [];
    for await (const item of Deno.readDir(sbox.path)) {
      items.push(item);
    }
    assertEquals(items.sort((a, b) => a.name.localeCompare(b.name)), [
      {
        isDirectory: false,
        isFile: true,
        isSymlink: false,
        name: "alpha",
      },
      {
        isDirectory: false,
        isFile: true,
        isSymlink: false,
        name: "beta",
      },
      {
        isDirectory: false,
        isFile: true,
        isSymlink: false,
        name: "gamma",
      },
    ]);
  },
});

Deno.test({
  name: "Deno.readFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.writeFile(sbox.resolve("foo"), new Uint8Array([0, 1, 2]));
    const content = await Deno.readFile(sbox.resolve("foo"));
    assertEquals(content, new Uint8Array([0, 1, 2]));
  },
});

Deno.test({
  name: "Deno.readLink() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.symlink("foo", sbox.resolve("bar"));
    assertEquals(await Deno.readLink(sbox.resolve("bar")), "foo");
  },
});

Deno.test({
  name: "Deno.readTextFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.writeTextFile(sbox.resolve("foo"), "Hello");
    const content = await Deno.readTextFile(sbox.resolve("foo"));
    assertEquals(content, "Hello");
  },
});

Deno.test({
  name: "Deno.realPath() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.symlink("foo", sbox.resolve("bar"));
    assertEquals(
      await Deno.realPath(sbox.resolve("foo")),
      await Deno.realPath(sbox.resolve("bar")),
    );
  },
});

Deno.test({
  name: "Deno.remove() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.remove(sbox.resolve("foo"));
    assertNotExists(sbox.resolve("foo"));
  },
});

Deno.test({
  name: "Deno.rename() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.rename(sbox.resolve("foo"), sbox.resolve("bar"));
    assertNotExists(sbox.resolve("foo"));
    assertExists(sbox.resolve("bar"));
    const s = await Deno.lstat(sbox.resolve("bar"));
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.stat() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    const s = await Deno.stat(sbox.resolve("foo"));
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.symlink() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.symlink("foo", sbox.resolve("bar"));
    const s = await Deno.lstat(sbox.resolve("bar"));
    assertEquals(s.isSymlink, true);
  },
});

Deno.test({
  name: "Deno.writeFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.writeFile(sbox.resolve("foo"), new Uint8Array([0, 1, 2]));
    const content = await Deno.readFile(sbox.resolve("foo"));
    assertEquals(content, new Uint8Array([0, 1, 2]));
  },
});

Deno.test({
  name: "Deno.writeTextFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using sbox = await sandbox();
    await using _f = await Deno.create(sbox.resolve("foo"));
    await Deno.writeTextFile(sbox.resolve("foo"), "Hello");
    const content = await Deno.readTextFile(sbox.resolve("foo"));
    assertEquals(content, "Hello");
  },
});

Deno.test({
  name: "Sandbox.resolve() supports multiple path arguments",
  fn: async () => {
    await using sbox = await sandbox();
    await Deno.mkdir(sbox.resolve("foo"));
    await Deno.mkdir(sbox.resolve("foo", "bar"));
    await using _f = await Deno.create(sbox.resolve("foo", "bar", "baz.txt"));
    assertExists(sbox.resolve("foo", "bar", "baz.txt"));
  },
});

Deno.test({
  name: "SandboxSync.resolve() supports multiple path arguments",
  fn: () => {
    using sbox = sandboxSync();
    Deno.mkdirSync(sbox.resolve("foo"));
    Deno.mkdirSync(sbox.resolve("foo", "bar"));
    using _f = Deno.createSync(sbox.resolve("foo", "bar", "baz.txt"));
    assertExists(sbox.resolve("foo", "bar", "baz.txt"));
  },
});
