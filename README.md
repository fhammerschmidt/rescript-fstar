# F* → OCaml → ReScript 12 → Node

A toy proof with a normal npm workflow. F* proves that addition on unary natural
numbers is commutative. Its executable implementation is extracted to OCaml,
converted to ReScript syntax by an isolated ReScript 11 compiler, then compiled
to JavaScript by ReScript 12 and executed by Node.

## Run it

Requires Node **20.11 or newer**, npm, and `tar`. Setup supports macOS and Linux
on ARM64 and x64; on Windows, use WSL. Only macOS ARM64 has been tested here.
You do not need to install OCaml, opam, F*, or Z3 globally.

```sh
npm ci
npm run setup
npm start
npm test
```

Setup downloads the pinned F* release (about 200 MB), verifies its SHA-256,
installs it with its bundled Z3 under `.tools/fstar`, and installs the v11
converter under `tools/ocaml-to-rescript`. The first setup requires access to
GitHub and npm; subsequent builds run offline. Both npm installs have lockfiles.

After the build messages, `npm start` prints:

```text
F* proved: add(a, b) = add(b, a) for all unary natural numbers.
2 + 3 = 5
3 + 2 = 5
```

## The proof

[`fstar/Toy.fst`](fstar/Toy.fst) defines `Zero`, `Succ`, and recursive addition.
For example, `Succ (Succ Zero)` represents two. It proves three lemmas by
structural induction:

- `add_zero_right`: `add n Zero == n`.
- `add_succ_right`: `add a (Succ b) == Succ (add a b)`.
- `add_commutative`: `add a b == add b a`, for every pair of unary naturals.

The executable `add`, `two`, `three`, and `five` are extracted; the lemmas are
erased. Every build checks the proof again before extraction. There are no
`admit`, `assume`, or lax-verification flags in the example.

`npm test` checks the generated JavaScript on all 441 pairs from 0 through 20,
and also changes the base case in a temporary F* module to confirm that F*
rejects the now-invalid proof. The finite runtime checks exercise the bridge;
the F* proof establishes commutativity for all values in its model.

## Build stages and files

| Command | Result |
| --- | --- |
| `npm run verify` | Checks `fstar/Toy.fst`; caches checked modules in `_build/fstar`. |
| `npm run extract` | Checks, then extracts `_build/fstar/Toy.ml`. |
| `npm run convert` | Extracts, then writes `_build/converted/Toy.res` and `src/generated/Toy.res`. |
| `npm run build` | Runs the previous stages, then compiles with ReScript **12.3.1**. |
| `npm start` | Builds, then runs `src/Main.res.js` with Node. |
| `npm test` | Builds, then runs Node's built-in test runner. |

All helper scripts are JavaScript in [`scripts/`](scripts/). The converter is
ReScript **11.1.4**, installed in its own directory so it cannot replace the root
v12 binaries. F* **v2026.09.27** and its platform-specific checksums are pinned in
[`scripts/toolchain.json`](scripts/toolchain.json).

The bridge invokes the v11 formatter directly:

```sh
node tools/ocaml-to-rescript/node_modules/rescript/bsc \
  -o _build/converted/Toy.res -format _build/fstar/Toy.ml
```

This keeps the original extracted OCaml available for inspection. The higher
level `rescript convert` command deletes its `.ml` input.

ReScript 12 compiles only `src/`, including the generated `.res`; it never sees
the `.ml` file. [`src/Main.res`](src/Main.res) runs the example, and
[`src/Nat.res`](src/Nat.res) converts unary values for display and runtime tests.
The generated ReScript is checked in for easy inspection and regenerated on
every build. [`src/generated/Toy.resi`](src/generated/Toy.resi) exposes the public
API and hides the extractor's internal constructor helpers.

## Scope of this bridge

The OCaml syntax in this example is accepted by v11's converter. One small
compatibility step removes the unused `open Prims` and rewrites `Prims.bool`
to native `bool`. ReScript 12 forbids redefining the built-in `bool` type, so
a `Prims` module with a boolean alias would not work. The original OCaml and
unmodified v11 conversion remain in `_build/` for comparison.

F* emits an internal successor projector whose input has a refinement requiring
`Succ`. That refinement disappears during extraction, leaving a partial match.
The public interface hides this helper. Warnings for that match and the
extractor's unused bindings are suppressed only in the generated module.

This is a bridge for this small datatype-based example, not a complete F*
runtime port. Ordinary F* `int`/`nat` arithmetic extracts to its arbitrary-
precision OCaml runtime, including Zarith; it cannot simply be mapped to
ReScript's fixed-width `int`. Unary naturals avoid that mismatch. More complex
programs may need runtime modules and additional compatibility work. Large
unary inputs can exhaust the JavaScript stack; the Node runtime and conversion
toolchain are not themselves formally verified by this project.

References: [F* installation](https://github.com/FStarLang/FStar/blob/master/INSTALL.md),
[F* release](https://github.com/FStarLang/FStar/releases/tag/v2026.09.27), and
[ReScript's v12 guide for converting generated OCaml](https://rescript-lang.org/docs/manual/migrate-to-v12/#converting-generated-ml-files).
