export type Sandbox = {
  /**
   * The path to the sandbox directory
   */
  readonly path: string;
  /**
   * The path to the original directory
   */
  readonly origin: string;
};

/**
 * Create a sandbox directory and move into it.
 *
 * It creates a temporary directory and changes the current working directory
 * to it. When disposed, it changes the current working directory back to the
 * previous one and removes the temporary directory.
 *
 * ```ts
 * import { sandbox } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", async () => {
 *   // Create a sandbox directory and move into it
 *   await using sbox = await sandbox();
 *
 *   // Create a file in the sandbox directory
 *   await using _f = await Deno.create("foo");
 *
 *   // Change permission
 *   await Deno.chmod("foo", 0o700);
 *
 *   // Create a link
 *   await Deno.link("foo", "bar");
 *
 *   // Check lstat
 *   const lstat = await Deno.lstat("foo");
 *
 *   // etc...
 *
 *   // The sandbox directory is removed and the current directory is restored
 *   // when the function is finished
 * });
 * ```
 *
 * Or call `Symbol.asyncDispose` to manually dispose the sandbox directory
 *
 * ```ts
 * import { sandbox } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", async () => {
 *   // Create a sandbox directory and move into it
 *   const sbox = await sandbox();
 *
 *   try {
 *     // Create a file in the sandbox directory
 *     await using _f = await Deno.create("foo");
 *
 *     // Change permission
 *     await Deno.chmod("foo", 0o700);
 *
 *     // Create a link
 *     await Deno.link("foo", "bar");
 *
 *     // Check lstat
 *     const lstat = await Deno.lstat("foo");
 *
 *     // etc...
 *   } finally {
 *     // The sandbox directory is removed and the current directory is restored
 *     // when 'Symbol.asyncDispose' is invoked
 *     await sbox[Symbol.asyncDispose]();
 *   }
 * });
 * ```
 */
export async function sandbox(): Promise<Sandbox & AsyncDisposable> {
  const path = await Deno.realPath(await Deno.makeTempDir());
  const origin = Deno.cwd();
  try {
    Deno.chdir(path);
  } catch (err) {
    Deno.removeSync(path, { recursive: true });
    throw err;
  }
  return {
    path,
    origin,
    [Symbol.asyncDispose]: async () => {
      Deno.chdir(origin);
      try {
        await Deno.remove(path, { recursive: true });
      } catch {
        // Fail silently
      }
    },
  };
}

/**
 * Create a sandbox directory and move into it synchronously.
 *
 * It creates a temporary directory and changes the current working directory
 * to it. When disposed, it changes the current working directory back to the
 * previous one and removes the temporary directory.
 *
 * ```ts
 * import { sandboxSync } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", () => {
 *   // Create a sandbox directory and move into it
 *   using sbox = sandboxSync();
 *
 *   // Create a file in the sandbox directory
 *   using _f = Deno.createSync("foo");
 *
 *   // Change permission
 *   Deno.chmodSync("foo", 0o700);
 *
 *   // Create a link
 *   Deno.linkSync("foo", "bar");
 *
 *   // Check lstat
 *   const lstat = Deno.lstatSync("foo");
 *
 *   // etc...
 *
 *   // The sandbox directory is removed and the current directory is restored
 *   // when the function is finished
 * });
 * ```
 *
 * Or call `Symbol.dispose` to manually dispose the sandbox directory
 *
 * ```ts
 * import { sandboxSync } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", () => {
 *   // Create a sandbox directory and move into it
 *   const sbox = sandboxSync();
 *
 *   try {
 *     // Create a file in the sandbox directory
 *     using _f = Deno.createSync("foo");
 *
 *     // Change permission
 *     Deno.chmodSync("foo", 0o700);
 *
 *     // Create a link
 *     Deno.linkSync("foo", "bar");
 *
 *     // Check lstat
 *     const lstat = Deno.lstatSync("foo");
 *
 *     // etc...
 *   } finally {
 *     // The sandbox directory is removed and the current directory is restored
 *     // when 'Symbol.dispose' is invoked
 *     sbox[Symbol.dispose]();
 *   }
 * });
 * ```
 */
export function sandboxSync(): Sandbox & Disposable {
  const path = Deno.realPathSync(Deno.makeTempDirSync());
  const origin = Deno.cwd();
  try {
    Deno.chdir(path);
  } catch (err) {
    Deno.removeSync(path, { recursive: true });
    throw err;
  }
  return {
    path,
    origin,
    [Symbol.dispose]: () => {
      Deno.chdir(origin);
      try {
        Deno.removeSync(path, { recursive: true });
      } catch {
        // Fail silently
      }
    },
  };
}
