# F* → OCaml → ReScript 12 → Node

A collection of numbered F* proofs with a normal npm workflow. Each executable
implementation is extracted to OCaml, converted to ReScript syntax by an
isolated ReScript 11 compiler, then compiled to JavaScript by ReScript 12 and
executed by Node. The same example number identifies the proof, generated
ReScript module, runner, and tests.

## Run it

Requires Node **20.11 or newer**, npm, and a separate F* installation. Install
F* using the [official installation instructions](https://github.com/FStarLang/FStar/blob/master/INSTALL.md).
Use the [official F* **v2026.09.27** release](https://github.com/FStarLang/FStar/releases/tag/v2026.09.27)
for macOS, Linux, or native Windows x64. WSL is optional. This example has been
tested on macOS ARM64; native Windows is checked by the repository's CI workflow.
The official binary distribution includes a compatible Z3. Follow
the upstream instructions for native dependencies on your platform, including
GMP and Zstandard where required.

On Windows, extract `fstar-v2026.09.27-Windows_NT-x86_64.zip` from that release.
Put `fstar.exe` on your `PATH`, or point the project at your chosen installation.
For macOS/Linux shells:

```sh
export FSTAR_EXE=/path/to/fstar/bin/fstar.exe
```

For Windows PowerShell:

```powershell
$env:FSTAR_EXE = 'C:\path\to\fstar\bin\fstar.exe'
```

Then run the normal npm workflow:

```sh
npm ci
npm run setup
npm start
npm test
```

`npm ci` installs ReScript 12 into the root `node_modules`. `npm run setup`
checks your F* installation and explicitly installs the pinned v11 converter
into `tools/ocaml-to-rescript/node_modules`. Both npm installs have lockfiles.
Subsequent builds run offline. There is no automatic setup hook. The local npm
workflow does not download F*, Z3, or system libraries or install global tools.

The workflow does not invoke a local OCaml compiler or opam. F* emits OCaml
source, and the prebuilt ReScript converter reads that source directly.

Earlier versions of this example downloaded F* into `.tools/fstar`, cached
archives in `.tools/downloads`, and attempted to stage native libraries in
`.tools/native`. These ignored directories may remain in an existing checkout;
the scripts no longer create or automatically use them.

`npm start` runs every example in number order. Select one example with:

```sh
npm start -- 01
npm start -- 02
npm test -- 02
npm run verify -- 02
```

Numbers without leading zeros also work, such as `npm start -- 2`.
After the build messages, example 01 prints:

```text
F* proved: add(a, b) = add(b, a) for all unary natural numbers.
2 + 3 = 5
3 + 2 = 5
```

## Examples

| Number | F* proof | Generated ReScript | ReScript runner | Guarantee |
| --- | --- | --- | --- | --- |
| 01 | [Example01.fst](examples/01-addition/Example01.fst) | [Example01.res](examples/01-addition/generated/Example01.res) | [Example01Main.res](examples/01-addition/Example01Main.res) | Addition on unary natural numbers is commutative. |
| 02 | [Example02.fst](examples/02-list-reversal/Example02.fst) | [Example02.res](examples/02-list-reversal/generated/Example02.res) | [Example02Main.res](examples/02-list-reversal/Example02Main.res) | Reversing a boolean list twice restores the original list. |

Each example keeps its source, generated module, public interface, display
helpers, and tests together:

```text
examples/
  01-addition/
    Example01.fst                   # proof and executable implementation
    Example01Main.res               # handwritten Node demo
    Example01Nat.res                # handwritten display/test helpers
    example01.test.mjs              # Node tests
    generated/
      Example01.res                 # generated; do not edit
      Example01.resi                # handwritten public API
  02-list-reversal/
    Example02.fst
    Example02Main.res
    Example02List.res
    example02.test.mjs
    generated/
      Example02.res
      Example02.resi
```

### 01: Addition

[`Example01.fst`](examples/01-addition/Example01.fst) defines `Zero`, `Succ`, and recursive addition.
For example, `Succ (Succ Zero)` represents two. It proves three lemmas by
structural induction:

- `add_zero_right`: `add n Zero == n`.
- `add_succ_right`: `add a (Succ b) == Succ (add a b)`.
- `add_commutative`: `add a b == add b a`, for every pair of unary naturals.

The executable `add`, `two`, `three`, and `five` are extracted; the lemmas are
erased.

Its tests check the generated JavaScript on all 441 pairs from 0 through 20,
and also changes the base case in a temporary F* module to confirm that F*
rejects the now-invalid proof. The finite runtime checks exercise the bridge;
the F* proof establishes commutativity for all values in its model.

### 02: List reversal

[`Example02.fst`](examples/02-list-reversal/Example02.fst) defines a boolean list,
concatenation, and reversal. It proves right identity and associativity for
concatenation, the relationship between reversal and concatenation, and finally
`reverse (reverse xs) == xs` for every list.

Its tests compare the extracted implementation with JavaScript array operations
for all 127 boolean lists up to length six. The F* proof covers all list lengths.

Every build checks the selected proofs again before extraction. There are no
`admit`, `assume`, or lax-verification flags in either example.

## Add an example

For example 03:

1. Create `examples/03-your-topic/Example03.fst`, declaring `module Example03`.
   Put the executable definitions and their proofs in this module.
2. Add `Example03Main.res` in the same directory. This is the handwritten demo
   and can call the generated `Example03` module.
3. Add a handwritten `generated/Example03.resi` to expose the intended public
   API. Prefix any helper modules with `Example03`, since ReScript module names
   are shared across the project.
4. Add `example03.test.mjs` beside the sources for runtime checks.
5. Run `npm start -- 03` and `npm test -- 03`. Check in the generated
   `generated/Example03.res` along with the source and interface.

The pipeline discovers `NN-description` folders automatically; there is no
registry or script to update. It checks the number, required filenames, and F*
module declaration. Keep the same `ExampleNN` name for the `.fst`, generated
`.res`/`.resi`, and `ExampleNNMain.res` runner. Numbers below 100 use two digits;
larger numbers use their normal decimal representation. Add a row to the index
above to describe the new example.

## Build stages and files

| Command | Result |
| --- | --- |
| `npm run setup` | Checks your installed F* and installs the project-local v11 converter. |
| `npm run verify` | Checks every example; caches checked modules in `_build/examples/NN-description/fstar`. |
| `npm run extract` | Checks, then extracts `ExampleNN.ml` into that example's build directory. |
| `npm run convert` | Extracts, then writes the unmodified conversion under `_build/examples/NN-description/converted` and adapted `examples/NN-description/generated/ExampleNN.res`. |
| `npm run build` | Runs the previous stages, then compiles with ReScript **12.3.1**. |
| `npm start` | Builds, then runs every `ExampleNNMain.res.js` with Node. |
| `npm test` | Builds, then discovers the examples' `.test.mjs` files and runs Node's built-in test runner. |

Append `-- NN` to any stage, `npm start`, or `npm test` to select one example.
Selection limits F* verification, extraction, conversion, and the demos/tests;
the ReScript compiler still compiles all source modules in the project.

The [native Windows CI workflow](.github/workflows/windows.yml) runs this pipeline
on Windows x64 with Node **20.11.0**, without WSL or a local OCaml compiler.
Its explicitly named provisioning step downloads and checksums the official
F* Windows archive into the temporary CI runner directory. That CI helper is
never called by the local npm installation or setup commands.

All helper scripts are JavaScript in [`scripts/`](scripts/). The converter is
ReScript **11.1.4**, installed in its own directory so it cannot replace the root
v12 binaries. Install F* **v2026.09.27** to reproduce the tested extraction;
other releases may change the generated OCaml and need compatibility updates.

The bridge invokes the v11 formatter directly:

```sh
node tools/ocaml-to-rescript/node_modules/rescript/bsc \
  -o _build/examples/01-addition/converted/Example01.res \
  -format _build/examples/01-addition/fstar/Example01.ml
```

This keeps the original extracted OCaml available for inspection. The higher
level `rescript convert` command deletes its `.ml` input.

ReScript 12 compiles `examples/`, including the generated `.res`; it never sees
the `.ml` files. The numbered `Main.res` files run the demos, and the numbered
helper modules convert values for display and runtime tests. Generated ReScript
is checked in for inspection and regenerated on each build. Handwritten `.resi`
files expose public APIs and hide the extractor's internal constructor helpers.

## Scope of this bridge

The OCaml syntax in these examples is accepted by v11's converter. One small
compatibility step removes the unused `open Prims` and rewrites `Prims.bool`
to native `bool`. ReScript 12 forbids redefining the built-in `bool` type, so
a `Prims` module with a boolean alias would not work. The original OCaml and
unmodified v11 conversion remain in `_build/` for comparison.

F* emits constructor projectors whose inputs have refinements requiring the
matching constructor. Those refinements disappear during extraction, leaving
partial matches. Public interfaces hide these helpers. Warnings for those
matches and the extractor's unused bindings are suppressed only in generated
modules.

This is a bridge for small datatype-based examples, not a complete F*
runtime port. Ordinary F* `int`/`nat` arithmetic extracts to its arbitrary-
precision OCaml runtime, including Zarith; it cannot simply be mapped to
ReScript's fixed-width `int`. Unary naturals and boolean lists avoid that
mismatch. More complex programs may need runtime modules and additional
compatibility work. Large recursive inputs can exhaust the JavaScript stack;
the Node runtime and conversion
toolchain are not themselves formally verified by this project.

References: [F* installation](https://github.com/FStarLang/FStar/blob/master/INSTALL.md),
[F* release](https://github.com/FStarLang/FStar/releases/tag/v2026.09.27), and
[ReScript's v12 guide for converting generated OCaml](https://rescript-lang.org/docs/manual/migrate-to-v12/#converting-generated-ml-files).
