// Handwritten Node demo; the verified implementation is generated/Example01.res.
let rec toInt = (value: Example01.nat): int =>
  switch value {
  | Zero => 0
  | Succ(predecessor) => 1 + toInt(predecessor)
  }

Console.log("F* proved: add(a, b) = add(b, a) for all unary natural numbers.")
Console.log(`2 + 3 = ${Example01.five->toInt->Int.toString}`)
Console.log(`3 + 2 = ${Example01.add(Example01.three, Example01.two)->toInt->Int.toString}`)
