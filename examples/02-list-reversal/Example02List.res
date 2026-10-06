// Display and test helpers; the verified functions live in generated/Example02.res.
let fromArray = (values: array<bool>): Example02.items =>
  values->Array.reduceRight(Example02.Empty, (rest, value) => Example02.Item(value, rest))

let rec toArray = (values: Example02.items): array<bool> =>
  switch values {
  | Empty => []
  | Item(value, rest) => [value]->Array.concat(toArray(rest))
  }
