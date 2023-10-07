# sandbox

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/sandbox)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/sandbox/mod.ts)
[![Test](https://github.com/lambdalisue/deno-sandbox/workflows/Test/badge.svg)](https://github.com/lambdalisue/deno-sandbox/actions?query=workflow%3ATest)

This module provides `sandbox()` function to create a temporary sandbox
directory. The `Sandbox` instance returned by `sandbox()` has a lot of
manipulation methods for files/directories in the temporary directory.

Note that the sandbox instance is [`Disposable`](https://deno.land/x/disposable)
thus uses can use `using()` function provided by `disposable` module to ensure
that the sandbox temporary directory is cleaned up.

## Usage

```typescript
import { sandbox } from "https://deno.land/x/sandbox/mod.ts";
import { usingResource } from "https://deno.land/x/disposable/mod.ts";

await usingResource(await sandbox(), async (sbox) => {
  // Create a file 'foo' in the sandbox
  const f = await sbox.create("foo");
  // Do what ever you want
});

// The sandbox directory is removed here.
```

See [`sandbox_test.ts`](./sandbox_test.ts) for examples.

## License

The code follows MIT license written in [LICENSE](./LICENSE). Contributors need
to agree that any modifications sent in this repository follow the license.
