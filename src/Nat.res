// Display and test helpers; the verified arithmetic lives in generated/Toy.res.
let rec toInt = (value: Toy.nat): int =>
  switch value {
  | Zero => 0
  | Succ(predecessor) => 1 + toInt(predecessor)
  }

let rec fromInt = (value: int): Toy.nat =>
  if value <= 0 {
    Zero
  } else {
    Succ(fromInt(value - 1))
  }
