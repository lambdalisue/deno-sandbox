import { resolve } from "@std/path/resolve";

export type Sandbox = {
  /**
   * The path to the sandbox directory
   */
  readonly path: string;
  /**
   * Resolve a path relative to the sandbox directory
   */
  resolve(path: string): string;
};

/**
 * Create a sandbox directory.
 *
 * It creates a temporary directory and returns a Sandbox object.
 * When disposed, it removes the temporary directory.
 *
 * Note: This function does not change the current working directory.
 * Use `sbox.resolve(path)` to get absolute paths within the sandbox.
 *
 * ```ts
 * import { sandbox } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", async () => {
 *   // Create a sandbox directory
 *   await using sbox = await sandbox();
 *
 *   // Create a file in the sandbox directory
 *   await using _f = await Deno.create(sbox.resolve("foo"));
 *
 *   // Change permission
 *   await Deno.chmod(sbox.resolve("foo"), 0o700);
 *
 *   // Create a link
 *   await Deno.link(sbox.resolve("foo"), sbox.resolve("bar"));
 *
 *   // Check lstat
 *   const lstat = await Deno.lstat(sbox.resolve("foo"));
 *
 *   // etc...
 *
 *   // The sandbox directory is removed when the function is finished
 * });
 * ```
 *
 * Or call `Symbol.asyncDispose` to manually dispose the sandbox directory
 *
 * ```ts
 * import { sandbox } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", async () => {
 *   // Create a sandbox directory
 *   const sbox = await sandbox();
 *
 *   try {
 *     // Create a file in the sandbox directory
 *     await using _f = await Deno.create(sbox.resolve("foo"));
 *
 *     // Change permission
 *     await Deno.chmod(sbox.resolve("foo"), 0o700);
 *
 *     // Create a link
 *     await Deno.link(sbox.resolve("foo"), sbox.resolve("bar"));
 *
 *     // Check lstat
 *     const lstat = await Deno.lstat(sbox.resolve("foo"));
 *
 *     // etc...
 *   } finally {
 *     // The sandbox directory is removed when 'Symbol.asyncDispose' is invoked
 *     await sbox[Symbol.asyncDispose]();
 *   }
 * });
 * ```
 */
export async function sandbox(): Promise<Sandbox & AsyncDisposable> {
  const path = await Deno.realPath(await Deno.makeTempDir());
  return {
    path,
    resolve: (relativePath: string) => {
      return resolve(path, relativePath);
    },
    [Symbol.asyncDispose]: async () => {
      try {
        await Deno.remove(path, { recursive: true });
      } catch {
        // Fail silently
      }
    },
  };
}

/**
 * Create a sandbox directory synchronously.
 *
 * It creates a temporary directory and returns a Sandbox object.
 * When disposed, it removes the temporary directory.
 *
 * Note: This function does not change the current working directory.
 * Use `sbox.resolve(path)` to get absolute paths within the sandbox.
 *
 * ```ts
 * import { sandboxSync } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", () => {
 *   // Create a sandbox directory
 *   using sbox = sandboxSync();
 *
 *   // Create a file in the sandbox directory
 *   using _f = Deno.createSync(sbox.resolve("foo"));
 *
 *   // Change permission
 *   Deno.chmodSync(sbox.resolve("foo"), 0o700);
 *
 *   // Create a link
 *   Deno.linkSync(sbox.resolve("foo"), sbox.resolve("bar"));
 *
 *   // Check lstat
 *   const lstat = Deno.lstatSync(sbox.resolve("foo"));
 *
 *   // etc...
 *
 *   // The sandbox directory is removed when the function is finished
 * });
 * ```
 *
 * Or call `Symbol.dispose` to manually dispose the sandbox directory
 *
 * ```ts
 * import { sandboxSync } from "@lambdalisue/sandbox";
 *
 * Deno.test("Perform tests in a sandbox directory", () => {
 *   // Create a sandbox directory
 *   const sbox = sandboxSync();
 *
 *   try {
 *     // Create a file in the sandbox directory
 *     using _f = Deno.createSync(sbox.resolve("foo"));
 *
 *     // Change permission
 *     Deno.chmodSync(sbox.resolve("foo"), 0o700);
 *
 *     // Create a link
 *     Deno.linkSync(sbox.resolve("foo"), sbox.resolve("bar"));
 *
 *     // Check lstat
 *     const lstat = Deno.lstatSync(sbox.resolve("foo"));
 *
 *     // etc...
 *   } finally {
 *     // The sandbox directory is removed when 'Symbol.dispose' is invoked
 *     sbox[Symbol.dispose]();
 *   }
 * });
 * ```
 */
export function sandboxSync(): Sandbox & Disposable {
  const path = Deno.realPathSync(Deno.makeTempDirSync());
  return {
    path,
    resolve: (relativePath: string) => {
      return resolve(path, relativePath);
    },
    [Symbol.dispose]: () => {
      try {
        Deno.removeSync(path, { recursive: true });
      } catch {
        // Fail silently
      }
    },
  };
}
