---
id: basics
title: 1 - CLVM Basics
sidebar_label: 1 - CLVM Basics
---

CLVM is the compiled, minimal version of ChiaLisp that is used by the Chia network.
The full set of operators is documented [here](https://github.com/Chia-Network/clvm/blob/main/docs/clvm.org)

This guide will cover the basics of the language and act as an introduction to the structure of programs.
You should be able to follow along by running a version of [clvm_tools](https://github.com/Chia-Network/clvm_tools).

## CLVM values

CLVM is built out of [cons boxes](https://en.wikipedia.org/wiki/Cons) and [atoms](https://www.gnu.org/software/emacs/manual/html_node/eintr/Lisp-Atoms.html#:~:text=Technically%20speaking%2C%20a%20list%20in,nothing%20in%20it%20at%20all.). These are referred to as CLVM Objects.
A cons box is a pair of CLVM Objects. The items in a cons box can either be an atom or another cons box.

### Atoms

An atom is a string of bytes. These bytes can be interpreted both as a signed big-endian integer and a byte string, depending on the operator using it.

All atoms in CLVM are immutable. All operators that perform computations on atoms create new atoms for the result.

Atoms can be printed in three different ways, decimal, hexadecimal and as a string. Hexadecimal values are prefixed by `0x`, and strings are quoted in `"`.
The way the integer is printed does not affect its underlying value.
The atom `100` printed in decimal is the same as `0x64` printed in hexadecimal. Likewise the value `0x68656c6c6f` is the same as `"hello"`.

When interpreting atoms as integers, it's important to remember that they are signed. In order to represent a positive integer, the most significant bit may not be set. Because of this, positive integers have a 0 byte prepended to them, in case the most significant bit in the next byte is set.

### Cons Boxes

Cons boxes are represented as a parentheses with two elements separated by a `.`.
For example:
```
(200 . "hello")

("hello" . ("world" . "!!!"))
```
Are legal cons boxes, but the following is not.
```
(200 . 300 . 400)
```
A cons box always has two elements.
However, we can chain cons boxes together to construct lists.

## Lists

Lists are enclosed by parentheses and each entry in the list is single spaced with no period between values.
Lists are much more commonly used than cons boxes as they are more versatile.

```
(200 300 "hello" "world")
```
You can also nest lists.
```
("hello" ("nested" "list") ("world"))
```

Remember a list is a representation of consecutive cons boxes terminated in a null atom `()`.
The following expressions are equal:
```
(200 . (300 . (400 . ())))

(200 300 400)
```

## Quoting

To interpret an atom as a value, rather than a program, it needs to be quoted with `q`. Quoted values form a cons box where the first item is the `q` operator.
For example, this program is just the value `100`:
```
(q . 100)
```

Note that in the higher level Chialisp language, values do not need to be quoted.

## Math

There are no support for floating point numbers in CLVM, only integers. There is no hard size limit on integers in CLVM.

The math operators are `+`, `-`, `*`, and `/`.

```lisp
$ brun '(- (q . 6) (q . 5))' '()'
1

$ brun '(* (q . 2) (q . 4) (q . 5))' '()'
40

$ brun '(+ (q . 10) (q . 20) (q . 30) (q . 40))' '()'
100

$ brun '(/ (q . 20) (q . 11))' '()'
1
```

*Note that `/` returns the* ***floored*** *quotient*

You may have noticed that the multiplication example above takes more than two parameters in the list.
This is because many operators can take a variable number of parameters.
`+` and `*` are commutative so the order of parameters does not matter.
For non-commutative operations, `(- 100 30 20 5)` is equivalent to `(- 100 (+ 30 20 5))`.
Similarly, `(/ 120 5 4 2)` is equivalent to `(/ 120 (* 5 4 2))`.

There is also support for negative values.

```lisp
$ brun '(- (q . 5) (q . 7))' '()'
-2


$ brun '(+ (q . 3) (q . -8))' '()'
-5
```

To use hexadecimal numbers, simply prefix them with `0x`.

```lisp
$ brun '(+ (q . 0x000a) (q . 0x000b))' '()'
21
```

The final mathematical operator is equal which acts similarly to == in other languages.

```lisp
$ brun '(= (q . 5) (q . 6))' '()'
()

$ brun '(= (q . 5) (q . 5))' '()'
1
```

As you can see above this language interprets some data as boolean values.

## Booleans

In this language an empty list `()` evaluate to `False`.
Any other value evaluates to `True`, though internally `True` is represented with `1`.

```lisp
$ brun '(= (q . 100) (q . 90))'
()

$ brun '(= (q . 100) (q . 100))'
1
```

The exception to this rule is `0` because `0` is  exactly the same as `()`.

```lisp
$ brun '(= (q . 0) ())' '()'
1

$ brun '(+ (q . 70) ())' '()'
70
```

## Flow Control

The `i` operator takes the form `(i A B C)` and acts as an if-statement that
evaluates to `B` if `A` is True and `C` otherwise.
```lisp
$ brun '(i (q . 0) (q . 70) (q . 80))' '()'
80

$ brun '(i (q . 1) (q . 70) (q . 80))' '()'
70

$ brun '(i (q . 12) (q . 70) (q . 80))' '()'
70

$ brun '(i (q . ()) (q . 70) (q . 80))' '()'
80
```

Note that both `B` and `C` are evaluated eagerly, just like all subexpressions.
To defer evaluation until after the condition, `B` and `C` must be quoted (with
`q`), and then evaluated with `(a)`.

```lisp
$ brun '(a (i (q . 0) (q . (x (q . 1337) )) (q . 1)) ())'
```

More on this later.

Now seems like a good time to clarify further about lists and programs.

## Lists and Programs

A list is any space-separated, ordered group of one or more elements inside brackets.
For example: `(70 80 90 100)`, `(0xf00dbabe 48 "hello")`, and `(90)` are all valid lists.

Lists can even contain other lists, such as `("list" "list" ("sublist" "sublist" ("sub-sublist")) "list")`.

Programs are a subset of lists which can be evaluated using CLVM.

**In order for a list to be a valid program:**

- **1. The first item in the list must be a valid operator**
- **2. Every item after the first must be a valid program**

This is why literal values and non-program lists *must* be quoted using `q . `.

Programs can contain non-program lists, but they also must be quoted, for example:

```lisp
$ brun '(q . (80 90 100))' '()'
(80 90 100)
```

And now that we know we can have programs inside programs we can create programs such as:

```lisp
$ brun '(i (= (q . 50) (q . 50)) (+ (q . 40) (q . 30)) (q . 20))' '()'
70
```

Programs in CLVM tend to get built in this fashion.
Smaller programs are assembled together to create a larger program.
It is recommended that you create your programs in an editor with brackets matching!

## List Operators

`f` returns the first element in a passed list.

```lisp
$ brun '(f (q . (80 90 100)))' '()'
80
```

`r` returns every element in a list except for the first.

```lisp
$ brun '(r (q . (80 90 100)))' '()'
(90 100)
```

`c` prepends an element to a list

```lisp
$ brun '(c (q . 70) (q . (80 90 100)))' '()'
(70 80 90 100)
```

And we can use combinations of these to access or replace any element we want from a list:

```lisp
$ brun '(c (q . 100) (r (q . (60 110 120))))' '()'
(100 110 120)

$ brun '(f (r (r (q . (100 110 120 130 140)))))' '()'
120
```

## Solutions and Environment Variables

Up until now our programs have not had any input or variables, however CLVM does have support for a kind of variable which is passed in through a solution.

It's important to remember that the context for ChiaLisp is for use in locking up coins with a puzzle program.
This means that we need to be able to pass some information to the puzzle.

A solution is a list of values passed to the puzzle.
The solution can be referenced with `1`.

```lisp
$ brun '1' '("this" "is the" "solution")'
("this" "is the" "solution")

$ brun '(f 1)' '(80 90 100 110)'
80

$ brun '(r 1)' '(80 90 100 110)'
(90 100 110)
```

And remember lists can be nested too.

```lisp
$ brun '(f (f (r 1)))' '((70 80) (90 100) (110 120))'
90

$ brun '(f (f (r 1)))' '((70 80) ((91 92 93 94 95) 100) (110 120))'
(91 92 93 94 95)
```

These environment variables can be used in combination with all other operators.

```lisp
$ brun '(+ (f 1) (q . 5))' '(10)'
15

$ brun '(* (f 1) (f 1))' '(10)'
100
```

This program checks that the second variable is equal to the square of the first variable.

```lisp
$ brun '(= (f (r 1)) (* (f 1) (f 1)))' '(5 25)'
1

$ brun '(= (f (r 1)) (* (f 1) (f 1)))' '(5 30)'
()
```

## Accessing Environmental Variables Through Integers

In the above examples we only used `1` which access the root of the tree and returns the entire solution list.

```lisp
$ brun '1' '("example" "data" "for" "test")'
("example" "data" "for" "test")
```

However, every unquoted integer in the lower level language refers to a part of the solution.

You can imagine a binary tree of `f` and `r`, where each node is numbered.

```lisp
$ brun '2' '("example" "data" "for" "test")'
"example"

$ brun '3' '("example" "data" "for" "test")'
("data" "for" "test")
```
And this is designed to work when there are lists inside lists too.
```
$ brun '4' '(("deeper" "example") "data" "for" "test")'
"deeper"

$ brun '5' '(("deeper" "example") "data" "for" "test")'
"data"

$ brun '6' '(("deeper" "example") "data" "for" "test")'
("example")
```

And so on.

## End of Part 1

This marks the end of this section of the guide.
In this section we have covered many of the basics of using CLVM/ChiaLisp.
It is recommended you play with using the information presented here for a bit before moving on.

This guide has not covered all of the operators available in CLVM - try using some of the other ones listed! [here](https://github.com/Chia-Network/clvm/blob/main/docs/clvm.org).
