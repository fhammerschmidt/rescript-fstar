// Generated from examples/02-list-reversal/Example02.fst by npm run convert. Do not edit.
// F* emits unused bindings and constructor projectors with erased refinements.
// A handwritten .resi can expose the public API and hide those helpers.
@@warning("-8-27-32")
type rec items =
  | Empty
  | Item(bool, items)
let uu___is_Empty = (projectee: items): bool =>
  switch projectee {
  | Empty => true
  | uu___ => false
  }
let uu___is_Item = (projectee: items): bool =>
  switch projectee {
  | Item(value, rest) => true
  | uu___ => false
  }
let __proj__Item__item__value = (projectee: items): bool =>
  switch projectee {
  | Item(value, rest) => value
  }
let __proj__Item__item__rest = (projectee: items): items =>
  switch projectee {
  | Item(value, rest) => rest
  }
let rec append = (xs: items, ys: items): items =>
  switch xs {
  | Empty => ys
  | Item(value, rest) => Item(value, append(rest, ys))
  }
let rec reverse = (xs: items): items =>
  switch xs {
  | Empty => Empty
  | Item(value, rest) => append(reverse(rest), Item(value, Empty))
  }
let sample: items = Item(true, Item(false, Item(false, Empty)))
