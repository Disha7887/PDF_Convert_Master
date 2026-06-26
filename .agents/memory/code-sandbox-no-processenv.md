---
name: code_execution sandbox has no process.env
description: The JS code_execution sandbox cannot read secrets from process.env; run secret-dependent SDK calls via a bash node script instead.
---

# code_execution sandbox lacks process.env secrets

`process.env.X` is undefined in the `code_execution` JS sandbox, and `viewEnvVars`
only returns secret *existence*, not values. So you cannot call a third-party SDK
that needs an API key from inside the sandbox.

**How to apply:** when you need to hit an authenticated API with a secret (e.g.
create Dodo products, verify a checkout), write a small `.mjs` script under the
relevant workspace package and run it with `bash` (`node ./scripts/foo.mjs`) — env
vars/secrets ARE present in the bash environment. Print only non-secret output
(ids, booleans), then delete the script. Also: dynamic-import packages from the
owning workspace's node_modules path; the repo root often doesn't have them.
