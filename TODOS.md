FIXME
- [ ] Last platform of "finished" duck appears to still be occupied so other ducks cannot use it to jump

GENERAL
- [~] Request for testing

INTRO
- [x] C: Title screen design
- [ ] C: Instruction screen
- [x] C: Add spinner directions
	- by default, current does nothing
	- if right spinner turns right, that increases current
	- if right spinner turns left, that decreases current
	- current speed stays at last right spinner value so player 2 has to keep adjusting the speed

RIVER & PLATFORMS (Matt/C)
- [x] Move platforms with river
- [x] Matt: Move platforms with current
<<<<<<< HEAD
  - [x] Check x positions to within half the width/radius
        if a platforms center is on or to the right of the current or if the platform center is to the left of the right of the current
  - Toggle class "isInCurrent" Not sure?
  - [x] For those inCurrent affect velocity
  - [x] River moves constantly
  - [x] Make current section move at the different rate
  - [x] Make current look like it's moving at a different rate
  - [x]Ensure current can slow down and speed up so that we can send baddies away or help ducks get on platforms
=======
  - Check x positions to within half the width/radius 
  - Toggle class "isInCurrent"
  - For those inCurrent affect velocity
  - Ensure current can slow down and speed up so that we can send baddies away or help ducks get on platforms
>>>>>>> 9da4103e9994eca204f821f64bf2d5116177b76b
- [x] C: Update platform graphics

DUCKS (Harrison)
- [x] Add entities
- [x] Move when platform is near
- [x] Duck end state
- [x] C: Duck placement (1-5 at end state)
- [x] Ducks can't jump on top of each other
- [x] Matt: Duck jump/no jump logic needs to be updated

GAME LOOP
- [ ] Goes on indefinitely? 
- [ ] Does this get harder with each duck crossed?
- [ ] Quit to reset?

GRAPHICS/UI
- [x] Matt: Add river current graphics
  - Use tiled background images with positions that change
- [ ] Improve river current graphics
  - Ripple effect ot BG
  - Move ripples up / down with current
- [x] C: Add indicators for spinners on current
