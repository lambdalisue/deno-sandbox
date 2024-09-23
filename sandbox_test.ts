import {
  assert,
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "@std/assert";
import { existsSync } from "@std/fs/exists";
import { sandbox } from "./sandbox.ts";

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
    "sandbox() changes the current working directory to the sandbox directory and back when disposed",
  fn: async () => {
    const cwd = () => Deno.realPathSync(Deno.cwd());
    await using sbox = await sandbox();
    assertEquals(cwd(), sbox.path);
    assertNotEquals(cwd(), sbox.origin);

    await sbox[Symbol.asyncDispose]();
    assertNotEquals(cwd(), sbox.path);
    assertEquals(cwd(), sbox.origin);
  },
});

Deno.test({
  name: "Deno.create() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    assertExists("foo");
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.lstat() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.lstat("foo");
    await assertRejects(() => Deno.lstat("bar"), Deno.errors.NotFound);
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.chmod() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.chmod("foo", 0o700);
    const s = await Deno.lstat("foo");
    assertEquals((s.mode ?? 0) & 0o777, 0o700);
  },
});

Deno.test({
  ignore: true, // This test requires a root privilege
  name: "Deno.chown() performs its operation in a sandbox directory",
  fn: async () => {
    const uid = 10000;
    const gid = 10000;
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.chown("foo", uid, gid);
    const s = await Deno.lstat("foo");
    assertEquals(s.uid, uid);
    assertEquals(s.gid, gid);
  },
});

Deno.test({
  name: "Deno.copyFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.copyFile("foo", "bar");
    assertExists("foo");
    assertExists("bar");
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name: "Deno.link() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.link("foo", "bar");
    assertExists("foo");
    assertExists("bar");
    const s = await Deno.lstat("bar");
    assertEquals(s.isFile, true);
    assertEquals(s.nlink, 2);
  },
});

Deno.test({
  name: "Deno.mkdir() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await Deno.mkdir("foo");
    assertExists("foo");
    const s = await Deno.lstat("foo");
    assertEquals(s.isDirectory, true);
  },
});

Deno.test({
  name: "Deno.open() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await using f = await Deno.open("foo");
    const s = await f.stat();
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.readDir() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _a = await Deno.create("alpha");
    await using _b = await Deno.create("beta");
    await using _c = await Deno.create("gamma");
    const items: Deno.DirEntry[] = [];
    for await (const item of Deno.readDir(".")) {
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
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.writeFile("foo", new Uint8Array([0, 1, 2]));
    const content = await Deno.readFile("foo");
    assertEquals(content, new Uint8Array([0, 1, 2]));
  },
});

Deno.test({
  name: "Deno.readLink() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.symlink("foo", "bar");
    assertEquals(await Deno.readLink("bar"), "foo");
  },
});

Deno.test({
  name: "Deno.readTextFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.writeTextFile("foo", "Hello");
    const content = await Deno.readTextFile("foo");
    assertEquals(content, "Hello");
  },
});

Deno.test({
  name: "Deno.realPath() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.symlink("foo", "bar");
    assertEquals(
      await Deno.realPath("foo"),
      await Deno.realPath("bar"),
    );
  },
});

Deno.test({
  name: "Deno.remove() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.remove("foo");
    assertNotExists("foo");
  },
});

Deno.test({
  name: "Deno.rename() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.rename("foo", "bar");
    assertNotExists("foo");
    assertExists("bar");
    const s = await Deno.lstat("bar");
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.stat() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    const s = await Deno.stat("foo");
    assertEquals(s.isFile, true);
  },
});

Deno.test({
  name: "Deno.symlink() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.symlink("foo", "bar");
    const s = await Deno.lstat("bar");
    assertEquals(s.isSymlink, true);
  },
});

Deno.test({
  name: "Deno.writeFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.writeFile("foo", new Uint8Array([0, 1, 2]));
    const content = await Deno.readFile("foo");
    assertEquals(content, new Uint8Array([0, 1, 2]));
  },
});

Deno.test({
  name: "Deno.writeTextFile() performs its operation in a sandbox directory",
  fn: async () => {
    await using _sbox = await sandbox();
    await using _f = await Deno.create("foo");
    await Deno.writeTextFile("foo", "Hello");
    const content = await Deno.readTextFile("foo");
    assertEquals(content, "Hello");
  },
});
