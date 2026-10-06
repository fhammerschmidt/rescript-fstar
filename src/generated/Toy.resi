// Public API of the extracted module. F*'s internal constructor helpers stay private.
type rec nat = Zero | Succ(nat)
let add: (nat, nat) => nat
let two: nat
let three: nat
let five: nat
