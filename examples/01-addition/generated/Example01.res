// Generated from examples/01-addition/Example01.fst by npm run convert. Do not edit.
// F* emits unused bindings and constructor projectors with erased refinements.
// A handwritten .resi can expose the public API and hide those helpers.
@@warning("-8-27-32")
type rec nat =
  | Zero
  | Succ(nat)
let uu___is_Zero = (projectee: nat): bool =>
  switch projectee {
  | Zero => true
  | uu___ => false
  }
let uu___is_Succ = (projectee: nat): bool =>
  switch projectee {
  | Succ(predecessor) => true
  | uu___ => false
  }
let __proj__Succ__item__predecessor = (projectee: nat): nat =>
  switch projectee {
  | Succ(predecessor) => predecessor
  }
let rec add = (a: nat, b: nat): nat =>
  switch a {
  | Zero => b
  | Succ(predecessor) => Succ(add(predecessor, b))
  }
let two: nat = Succ(Succ(Zero))
let three: nat = Succ(two)
let five: nat = add(two, three)
