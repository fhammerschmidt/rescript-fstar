module Example01

// Unary natural numbers keep the extracted example independent of Zarith.
type nat =
  | Zero : nat
  | Succ : predecessor:nat -> nat

let rec add (a:nat) (b:nat) : Tot nat (decreases a) =
  match a with
  | Zero -> b
  | Succ predecessor -> Succ (add predecessor b)

// A proof of right identity: n + 0 = n.
let rec add_zero_right (n:nat)
  : Lemma (add n Zero == n) (decreases n) =
  match n with
  | Zero -> ()
  | Succ predecessor -> add_zero_right predecessor

// Move one successor out of the second argument.
let rec add_succ_right (a:nat) (b:nat)
  : Lemma (add a (Succ b) == Succ (add a b)) (decreases a) =
  match a with
  | Zero -> ()
  | Succ predecessor -> add_succ_right predecessor b

// Commutativity for every pair of unary natural numbers.
let rec add_commutative (a:nat) (b:nat)
  : Lemma (add a b == add b a) (decreases a) =
  match a with
  | Zero -> add_zero_right b
  | Succ predecessor ->
    add_commutative predecessor b;
    add_succ_right b predecessor

let two = Succ (Succ Zero)
let three = Succ two
let five = add two three
