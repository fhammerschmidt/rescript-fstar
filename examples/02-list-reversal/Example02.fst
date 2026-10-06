module Example02

// A self-contained list of booleans needs no arbitrary-precision integer runtime.
type items =
  | Empty : items
  | Item : value:bool -> rest:items -> items

let rec append (xs:items) (ys:items) : Tot items (decreases xs) =
  match xs with
  | Empty -> ys
  | Item value rest -> Item value (append rest ys)

let rec reverse (xs:items) : Tot items (decreases xs) =
  match xs with
  | Empty -> Empty
  | Item value rest -> append (reverse rest) (Item value Empty)

let rec append_empty_right (xs:items)
  : Lemma (append xs Empty == xs) (decreases xs) =
  match xs with
  | Empty -> ()
  | Item value rest -> append_empty_right rest

let rec append_associative (xs:items) (ys:items) (zs:items)
  : Lemma (append (append xs ys) zs == append xs (append ys zs)) (decreases xs) =
  match xs with
  | Empty -> ()
  | Item value rest -> append_associative rest ys zs

let rec reverse_append (xs:items) (ys:items)
  : Lemma (reverse (append xs ys) == append (reverse ys) (reverse xs)) (decreases xs) =
  match xs with
  | Empty -> append_empty_right (reverse ys)
  | Item value rest ->
    reverse_append rest ys;
    append_associative (reverse ys) (reverse rest) (Item value Empty)

// Reversing twice restores every boolean list, not only the sample below.
let rec reverse_involution (xs:items)
  : Lemma (reverse (reverse xs) == xs) (decreases xs) =
  match xs with
  | Empty -> ()
  | Item value rest ->
    reverse_append (reverse rest) (Item value Empty);
    reverse_involution rest

let sample = Item true (Item false (Item false Empty))
