// Generated from ../Example02.fst. Do not edit.
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
