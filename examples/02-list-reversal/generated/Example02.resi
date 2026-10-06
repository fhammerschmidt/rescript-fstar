// Public API for Example02. F*'s internal constructor helpers stay private.
type rec items = Empty | Item(bool, items)
let append: (items, items) => items
let reverse: items => items
let sample: items
