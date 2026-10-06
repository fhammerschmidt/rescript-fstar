// Display and test helpers; the verified arithmetic lives in generated/Example01.res.
let rec toInt = (value: Example01.nat): int =>
  switch value {
  | Zero => 0
  | Succ(predecessor) => 1 + toInt(predecessor)
  }

let rec fromInt = (value: int): Example01.nat =>
  if value <= 0 {
    Zero
  } else {
    Succ(fromInt(value - 1))
  }
