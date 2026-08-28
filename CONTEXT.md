# Marcel noir

A single-page tool for reading a juggling pattern three ways at once: as an
animation, as a ladder diagram, and as a walk through a state graph. This file
is the shared vocabulary, the words the code, the UI and the docs all use for
the same thing.

## Notation

**Siteswap**:
A periodic juggling pattern written as one digit per beat, each digit the height
of the throw made on that beat. `531`, `97531`.
_Avoid_: sequence, notation string, code

**Throw**:
A single number in a siteswap: how many beats until the thrown ball is next
thrown again. Height `3` lands three beats later.
_Avoid_: toss, digit, number

**Height**:
The value of a throw. Odd heights cross to the other hand, even heights come
back to the same one.
_Avoid_: throw length, duration, value

**Hole**:
A throw of height `0`, meaning an empty hand on that beat. A hole is a real
throw in the notation, not a gap in it.
_Avoid_: zero, rest, pause, skip

**Beat**:
One tick of the pattern. Exactly one hand throws per beat, alternating: even
beats are the right hand, odd beats the left.
_Avoid_: tick, step, frame

**Period**:
The number of beats before a siteswap repeats, which is the length of the
written pattern.
_Avoid_: length, cycle length

**Balls**:
How many balls a siteswap needs, which is always the average of its throws. The
app calls this `n`.
_Avoid_: props, objects, count

**Max height**:
The ceiling on throw height for the graph currently drawn, and therefore how
many future beats a state tracks. The app calls this `h`.
_Avoid_: h, max throw, ceiling, depth

**Collision**:
Two throws in a pattern landing on the same beat. A siteswap with a collision is
invalid however good its average is.
_Avoid_: clash, conflict, overlap

## States

**State**:
Which of the next `h` beats already have a ball landing on them, written as a
bit per beat. Bit 0 set means a ball is in hand right now and must be thrown.
_Avoid_: position, configuration, node

**Ground state**:
The state where the `n` balls land on the next `n` beats with no gaps, which is
what you sit in while running a plain cascade or fountain.
_Avoid_: base state, resting state, home

**Excited state**:
Any state that is not the ground state. Reaching one costs a throw higher than
`n` and leaving one costs a throw lower.
_Avoid_: non-ground, unstable state

**Excitation**:
How far a state sits from the ground state, graded so that a throw of height `t`
moves you by exactly `t - n`. It is the vertical axis of the state graph.
_Avoid_: level, depth, distance, energy

**Walk**:
The path of states a pattern or a sequence of clicks traces through the graph.
A **closed walk** returns to where it started and is therefore a valid siteswap.
An **open walk** does not and has no notation of its own.
_Avoid_: path, trace, route, tour

## Views

**State graph**:
Every state reachable with `n` balls at max height `h`, laid out by excitation,
with an arrow per legal throw. Every valid siteswap is a closed walk on it.
_Avoid_: transition diagram, automaton, network

**Ladder diagram**:
Two horizontal rails, one per hand, with an arc per ball showing which beat it
was thrown on and which beat it lands on. The arcs crossing any given beat are
exactly the set bits of the state at that beat.
_Avoid_: causal diagram, timeline, arc diagram

**Dwell**:
The fraction of a beat a hand holds a ball between catching it and throwing it
again.
_Avoid_: hold time, carry

**Classic**:
A well-known named pattern offered as a one-click preset, such as the cascade,
fountain, shower, box or columns.
_Avoid_: preset, favourite, example, template
