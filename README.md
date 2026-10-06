# F* → ReScript → Node

F* checks the proofs, extracts their implementations to OCaml, and ReScript 11
converts that OCaml to ReScript. ReScript 12 then compiles it to JavaScript.

| Example | Proof and implementation | Generated ReScript |
| --- | --- | --- |
| 01: Addition is commutative | [Example01.fst](examples/01-addition/Example01.fst) | [Example01.res](examples/01-addition/generated/Example01.res) |
| 02: Reversing twice restores a list | [Example02.fst](examples/02-list-reversal/Example02.fst) | [Example02.res](examples/02-list-reversal/generated/Example02.res) |

Each example has three files:

```text
examples/01-addition/
  Example01.fst              # F* implementation and proofs
  generated/Example01.res    # generated ReScript; do not edit
  Example01Main.res          # handwritten Node demo
```

The proofs are erased during extraction. Only executable code remains in the
generated `.res` file.

## Run

Requires Node **20.11+**, npm, and F*. Install F* using the
[official instructions](https://github.com/FStarLang/FStar/blob/master/INSTALL.md).
The examples use [F* v2026.09.27](https://github.com/FStarLang/FStar/releases/tag/v2026.09.27),
whose binary distributions include Z3. Follow the upstream platform prerequisites.
Native Windows works; WSL is optional. No local OCaml compiler is needed.

Put `fstar.exe` on `PATH`, or choose its location:

```sh
export FSTAR_EXE=/path/to/fstar/bin/fstar.exe
```

In Windows PowerShell:

```powershell
$env:FSTAR_EXE = 'C:\path\to\fstar\bin\fstar.exe'
```

```sh
npm ci
npm run setup       # install the isolated ReScript 11.1.4 converter
npm start           # verify, generate, compile with ReScript 12.3.1, and run all
npm start -- 02     # just example 02
npm run verify     # just check the F* proofs
```

Setup only installs project-local npm dependencies. F* is installed separately.
Intermediate OCaml and conversion output go into the ignored `_build/` directory.
F* checks the source proofs; the conversion and JavaScript runtime are trusted.
These examples cover a small subset of F* without its general arithmetic runtime.

## Add an example

Create `examples/03-topic/Example03.fst` with `module Example03` and a handwritten
`Example03Main.res` demo. Run `npm start -- 03` to generate
`generated/Example03.res`. Check in those three files and add a row to the table.
Examples are discovered automatically; there is no registry to update.
