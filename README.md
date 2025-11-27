# sandbox

[![JSR](https://jsr.io/badges/@lambdalisue/sandbox)](https://jsr.io/@lambdalisue/sandbox)
[![Test](https://github.com/lambdalisue/deno-sandbox/actions/workflows/test.yml/badge.svg)](https://github.com/lambdalisue/deno-sandbox/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/lambdalisue/deno-sandbox/graph/badge.svg?token=AEZJlup3Et)](https://codecov.io/gh/lambdalisue/deno-sandbox)

This module provides `sandbox()` and `sandboxSync()` function to create a
temporary sandbox directory.

## Usage

```ts
import { sandbox, sandboxSync } from "@lambdalisue/sandbox";

{
  await using sbox = await sandbox();
  // Create files in the sandbox directory using sbox.resolve()
  await Deno.writeTextFile(sbox.resolve("foo.txt"), "Hello");
  const content = await Deno.readTextFile(sbox.resolve("foo.txt"));
}
// The sandbox directory is automatically removed here

{
  using sbox = sandboxSync();
  // Create files in the sandbox directory using sbox.resolve()
  Deno.writeTextFileSync(sbox.resolve("bar.txt"), "World");
  const content = Deno.readTextFileSync(sbox.resolve("bar.txt"));
}
// The sandbox directory is automatically removed here
```

**Note**: This module does not change the current working directory. This design
allows parallel test execution without interference. Use `sbox.resolve(path)` to
get absolute paths within the sandbox directory.

## License

The code follows MIT license written in [LICENSE](./LICENSE). Contributors need
to agree that any modifications sent in this repository follow the license.
