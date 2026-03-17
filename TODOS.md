GENERAL
- [ ] Request for testing

INTRO
- [ ] C: Title screen design
- [ ] C: Instruction screen
- [ ] C: Add spinner directions
	- by default, current does nothing
	- if right spinner turns right, that increases current
	- if right spinner turns left, that decreases current
	- current speed stays at last right spinner value so player 2 has to keep adjusting the speed

RIVER & PLATFORMS (Matt/C)
- [x] Move platforms with river
- [ ] Matt: Move platforms with current
  - Check x positions to within half the width/radius 
  - Toggle class "isInCurrent"
  - For those inCurrent affect velocity
  - Ensure current can slow down and speed up so that we can send baddies away or help ducks get on platforms
- [x] C: Update platform graphics

DUCKS (Harrison)
- [x] Add entities
- [x] Move when platform is near
- [x] Duck end state
- [ ] C: Duck placement (1-5 at end state)
- [ ] Ducks can't jump on top of each other
- [ ] Matt: Duck jump/no jump logic needs to be updated

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
- [ ] C: Add indicators for spinners on current
