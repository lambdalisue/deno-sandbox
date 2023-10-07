import type { Disposable } from "https://deno.land/x/disposable@v1.1.1/mod.ts";
import * as path from "https://deno.land/std@0.203.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.203.0/fs/mod.ts";

export type SandboxOptions = Deno.MakeTempOptions;

// Support `using` in TypeScript 5.2
// deno-lint-ignore no-explicit-any
const dispose = "dispose" in (Symbol as any)
  ? Symbol.dispose
  : Symbol("dispose");

class Sandbox implements Disposable {
  readonly root: string;

  #previousCwd: string;
  #resources: Deno.Closer[];

  // Show debug messages
  debug = false;

  constructor(root: string) {
    this.root = path.resolve(root);
    this.#previousCwd = Deno.cwd();
    this.#resources = [];
    Deno.chdir(this.root);
  }

  /**
   * Resolves `paths` in a sandbox directory to an absolute path
   */
  resolve(...paths: string[]): string {
    const p = path.join(...paths);
    if (path.isAbsolute(p)) {
      throw new Error("Unable to specify an absolute path to sandbox methods");
    }
    return path.resolve(this.root, p);
  }

  /**
   * Test whether or not the given path exists in a sandbox directory by checking with the file system
   */
  exists(filePath: string): Promise<boolean> {
    return fs.exists(this.resolve(filePath));
  }

  chmod(path: string, mode: number): Promise<void> {
    return Deno.chmod(this.resolve(path), mode);
  }

  chown(path: string, uid: number | null, gid: number | null): Promise<void> {
    return Deno.chown(this.resolve(path), uid, gid);
  }

  copyFile(fromPath: string, toPath: string): Promise<void> {
    return Deno.copyFile(this.resolve(fromPath), this.resolve(toPath));
  }

  async create(path: string): Promise<Deno.FsFile> {
    const f = await Deno.create(this.resolve(path));
    this.#resources.push(f);
    return f;
  }

  link(oldpath: string, newpath: string): Promise<void> {
    return Deno.link(this.resolve(oldpath), this.resolve(newpath));
  }

  lstat(path: string): Promise<Deno.FileInfo> {
    return Deno.lstat(this.resolve(path));
  }

  makeTempDir(options?: Omit<Deno.MakeTempOptions, "dir">): Promise<string> {
    return Deno.makeTempDir({
      ...options || {},
      dir: this.root,
    });
  }

  makeTempFile(options?: Omit<Deno.MakeTempOptions, "dir">): Promise<string> {
    return Deno.makeTempFile({
      ...options || {},
      dir: this.root,
    });
  }

  mkdir(path: string, options?: Deno.MkdirOptions): Promise<void> {
    return Deno.mkdir(this.resolve(path), options);
  }

  async open(path: string, options?: Deno.OpenOptions): Promise<Deno.FsFile> {
    const f = await Deno.open(this.resolve(path), options);
    this.#resources.push(f);
    return f;
  }

  readDir(path: string): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(this.resolve(path));
  }

  readFile(path: string): Promise<Uint8Array> {
    return Deno.readFile(this.resolve(path));
  }

  readLink(path: string): Promise<string> {
    return Deno.readLink(this.resolve(path));
  }

  readTextFile(path: string): Promise<string> {
    return Deno.readTextFile(this.resolve(path));
  }

  realPath(path: string): Promise<string> {
    return Deno.realPath(this.resolve(path));
  }

  remove(path: string, options?: Deno.RemoveOptions): Promise<void> {
    return Deno.remove(this.resolve(path), options);
  }

  rename(oldpath: string, newpath: string): Promise<void> {
    return Deno.rename(this.resolve(oldpath), this.resolve(newpath));
  }

  stat(path: string): Promise<Deno.FileInfo> {
    return Deno.stat(this.resolve(path));
  }

  symlink(
    oldpath: string,
    newpath: string,
    options?: Deno.SymlinkOptions,
  ): Promise<void> {
    return Deno.symlink(this.resolve(oldpath), this.resolve(newpath), options);
  }

  writeFile(
    path: string,
    data: Uint8Array,
    options?: Deno.WriteFileOptions,
  ): Promise<void> {
    return Deno.writeFile(this.resolve(path), data, options);
  }

  writeTextFile(
    path: string,
    data: string,
    options?: Deno.WriteFileOptions,
  ): Promise<void> {
    return Deno.writeTextFile(this.resolve(path), data, options);
  }

  dispose(): void {
    Deno.chdir(this.#previousCwd);
    try {
      Deno.removeSync(this.root, { recursive: true });
    } catch (e) {
      if (this.debug) {
        console.warn("failed to remove sandbox directory", e);
      }
      // Do nothing while this is cleanup
    }
    this.#resources.forEach((r) => {
      try {
        r.close();
      } catch (e) {
        if (this.debug) {
          console.warn("failed to close resource", e, r);
        }
        // Do nothing while this is cleanup
      }
    });
  }

  [dispose](): void {
    this.dispose();
  }
}

/**
 * Create a temporary directory and return a Sandbox instance which manipulate
 * file/directory entries in the temporary directory
 */
export async function sandbox(options: SandboxOptions = {}): Promise<Sandbox> {
  const path = await Deno.makeTempDir(options);
  const sbox = new Sandbox(path);
  return sbox;
}

/**
 * Create a temporary directory and return a Sandbox instance which manipulate
 * file/directory entries in the temporary directory
 */
export function sandboxSync(options: SandboxOptions = {}): Sandbox {
  const path = Deno.makeTempDirSync(options);
  const sbox = new Sandbox(path);
  return sbox;
}

export type { Sandbox };
