// Handwritten Node demo; the verified implementation is generated/Example02.res.
let rec toArray = (values: Example02.items): array<bool> =>
  switch values {
  | Empty => []
  | Item(value, rest) => [value]->Array.concat(toArray(rest))
  }

Console.log("F* proved: reverse(reverse(xs)) = xs for every boolean list.")
Console.log2("original:", Example02.sample->toArray)
Console.log2("reversed:", Example02.sample->Example02.reverse->toArray)
Console.log2("reversed twice:", Example02.sample->Example02.reverse->Example02.reverse->toArray)
