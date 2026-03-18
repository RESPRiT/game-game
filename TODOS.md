INTRO

- [ ] C: Instruction screen
  - Add spinner directions
  - Maybe interactive?
    played before skip, otherwise show controls

RIVER & PLATFORMS (Matt/C)

- [x] Move platforms with river
- [ ] Matt: Move platforms with current
  - [x] Check x positions to within half the width/radius
        if a platforms center is on or to the right of the current or if the platform center is to the left of the right of the current
  - Toggle class "isInCurrent" Not sure?
  - [x] For those inCurrent affect velocity
  - [x] River moves constantly
  - [x] Make current section move at the different rate
  - [] Make current look like it's moving at a different rate
  - [x]Ensure current can slow down and speed up so that we can send baddies away or help ducks get on platforms
- [x] C: Update platform graphics

DUCKS (Harrison)

- [x] Add entities
- [x] Move when platform is near
- [x] Duck end state
- [ ] C: Duck placement (1-5 at end state)
- [x] Ducks can't jump on top of each other
- [x] Matt: Duck jump/no jump logic needs to be updated

GAME LOOP

- [ ] Goes on indefinitely?
- [ ] Does this get harder with each duck crossed?
- [ ] Quit to reset?

GRAPHICS/UI

- [ ] Add river current graphics
  - Use tiled background images with positions that change
