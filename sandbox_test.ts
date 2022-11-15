import { fs, path } from "./deps.ts";
import { assert, assertEquals, assertNotEquals, using } from "./deps_test.ts";
import { sandbox } from "./sandbox.ts";

Deno.test({
  name: "sandbox() returns a Sandbox instance which is disposable",
  fn: async () => {
    const sbox = await sandbox();
    assert(
      await fs.exists(sbox.root),
      "sandbox directory must be created",
    );

    // using automatically call `dispose()` method of the resouce
    await using(sbox, async () => {});

    assert(
      !(await fs.exists(sbox.root)),
      "sandbox directory must be removed",
    );
  },
});

Deno.test({
  name: "sandbox() changes cwd until disposed",
  fn: async () => {
    const cwd = Deno.cwd();
    const sbox = await sandbox();
    const root = Deno.realPathSync(sbox.root);

    assertNotEquals(Deno.cwd(), cwd);
    assertEquals(Deno.cwd(), root);

    // using automatically call `dispose()` method of the resouce
    await using(sbox, async () => {});

    assertEquals(Deno.cwd(), cwd);
    assertNotEquals(Deno.cwd(), root);
  },
});

Deno.test({
  name: "Sandbox.resolve() returns an absolute path from a sandbox directory",
  fn: async () => {
    await using(await sandbox(), (sbox) => {
      assertEquals(
        sbox.resolve("foo", "bar"),
        path.join(sbox.root, "foo", "bar"),
      );
    });
  },
});

Deno.test({
  name: "Sandbox.exists() returns if a path exists in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      assert(sbox.exists("foo"), "foo must exist");
    });
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name:
    "Sandbox.chmod() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.chmod("foo", 0o700);
      const s = await sbox.lstat("foo");
      assertEquals((s.mode ?? 0) & 0o777, 0o700);
    });
  },
});

Deno.test({
  ignore: true, // EPERM: Operation not permitted
  name:
    "Sandbox.chown() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      const uid = 10000;
      const gid = 10000;
      await sbox.create("foo");
      await sbox.chown("foo", uid, gid);
      const s = await sbox.lstat("foo");
      assertEquals(s.uid, uid);
      assertEquals(s.gid, gid);
    });
  },
});

Deno.test({
  name:
    "Sandbox.copyFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.copyFile("foo", "bar");
      assert(await sbox.exists("foo"), "foo must exist");
      assert(await sbox.exists("bar"), "bar must exist");
      const s = await sbox.lstat("bar");
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.create() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      assert(await sbox.exists("foo"), "foo must exist");
      const s = await sbox.lstat("foo");
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  ignore: Deno.build.os == "windows",
  name:
    "Sandbox.link() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.link("foo", "bar");
      assert(await sbox.exists("foo"), "foo must exist");
      assert(await sbox.exists("bar"), "bar must exist");
      const s = await sbox.lstat("bar");
      assertEquals(s.isFile, true);
      assertEquals(s.nlink, 2);
    });
  },
});

Deno.test({
  name:
    "Sandbox.lstat() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      const s = await sbox.lstat("foo");
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.makeTempDir() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      const t = await sbox.makeTempDir();
      assert(await fs.exists(t), `${t} must exist`);
      const s = await Deno.lstat(t);
      assertEquals(s.isDirectory, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.makeTempFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      const t = await sbox.makeTempFile();
      assert(await fs.exists(t), `${t} must exist`);
      const s = await Deno.lstat(t);
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.mkdir() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.mkdir("foo");
      assert(await sbox.exists("foo"), `foo} must exist`);
      const s = await sbox.lstat("foo");
      assertEquals(s.isDirectory, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.open() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      const f = await sbox.open("foo");
      const s = await f.stat();
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.readDir() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("alpha");
      await sbox.create("beta");
      await sbox.create("gamma");
      const items: Deno.DirEntry[] = [];
      for await (const item of sbox.readDir("")) {
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
    });
  },
});

Deno.test({
  name:
    "Sandbox.readFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.writeFile("foo", new Uint8Array([0, 1, 2]));
      const content = await sbox.readFile("foo");
      assertEquals(content, new Uint8Array([0, 1, 2]));
    });
  },
});

Deno.test({
  name:
    "Sandbox.readLink() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.symlink("foo", "bar");
      assertEquals(await sbox.readLink("bar"), sbox.resolve("foo"));
    });
  },
});

Deno.test({
  name:
    "Sandbox.readTextFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.writeTextFile("foo", "Hello");
      const content = await sbox.readTextFile("foo");
      assertEquals(content, "Hello");
    });
  },
});

Deno.test({
  name:
    "Sandbox.realPath() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.symlink("foo", "bar");
      assertEquals(
        await sbox.realPath("bar"),
        await Deno.realPath(sbox.resolve("bar")),
      );
    });
  },
});

Deno.test({
  name:
    "Sandbox.remove() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.remove("foo");
      assert(!(await sbox.exists("foo")), "foo must not exist");
    });
  },
});

Deno.test({
  name:
    "Sandbox.rename() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.rename("foo", "bar");
      assert(!(await sbox.exists("foo")), "foo must not exist");
      assert(await sbox.exists("bar"), "bar must exist");
      const s = await sbox.lstat("bar");
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.stat() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      const s = await sbox.stat("foo");
      assertEquals(s.isFile, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.symlink() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.symlink("foo", "bar");
      const s = await sbox.lstat("bar");
      assertEquals(s.isSymlink, true);
    });
  },
});

Deno.test({
  name:
    "Sandbox.writeFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.writeFile("foo", new Uint8Array([0, 1, 2]));
      const content = await sbox.readFile("foo");
      assertEquals(content, new Uint8Array([0, 1, 2]));
    });
  },
});

Deno.test({
  name:
    "Sandbox.writeTextFile() invokes corresponding method of Deno in a sandbox directory",
  fn: async () => {
    await using(await sandbox(), async (sbox) => {
      await sbox.create("foo");
      await sbox.writeTextFile("foo", "Hello");
      const content = await sbox.readTextFile("foo");
      assertEquals(content, "Hello");
    });
  },
});
