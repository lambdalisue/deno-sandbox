# sandbox

[![JSR](https://jsr.io/badges/@lambdalisue/sandbox)](https://jsr.io/@lambdalisue/sandbox)
[![Test](https://github.com/lambdalisue/deno-sandbox/workflows/Test/badge.svg)](https://github.com/lambdalisue/deno-sandbox/actions?query=workflow%3ATest)
[![codecov](https://codecov.io/gh/lambdalisue/deno-sandbox/graph/badge.svg?token=AEZJlup3Et)](https://codecov.io/gh/lambdalisue/deno-sandbox)

This module provides `sandbox()` and `sandboxSync()` function to create a
temporary sandbox directory and temporary move into it.

## Usage

```ts
import { sandbox, sandboxSync } from "@lambdalisue/sandbox";

{
  await using sbox = await sandbox();
  // The current working directory is changed to the sandbox directory here.
  // Do what ever you want
}
// The current working directory is changed back to the original directory here.

{
  using sbox = sandboxSync();
  // The current working directory is changed to the sandbox directory here.
  // Do what ever you want
}
// The current working directory is changed back to the original directory here.
```

## License

The code follows MIT license written in [LICENSE](./LICENSE). Contributors need
to agree that any modifications sent in this repository follow the license.
