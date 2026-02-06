import "./style.css";
import { PLAYER_1, PLAYER_2 } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as SPINNER_1,
  PLAYER_2 as SPINNER_2,
} from "@rcade/plugin-input-spinners";

//-----------------
// INITIALIZATION

const app = document.querySelector<HTMLDivElement>("#app")!;
const current = document.querySelector<HTMLDivElement>("#current")!;
const flow = document.querySelector<HTMLDivElement>("#flow")!;
const cursor_container = document.querySelector<HTMLDivElement>("#cursor-container")!;
const cursor = document.querySelector<HTMLDivElement>("#cursor")!;
const platforms = document.querySelector<HTMLDivElement>("#platforms")!;
const ducks = document.querySelector<HTMLDivElement>("#ducks")!;

let gameStarted = false;

/// current constants
// bounds
const MAX_POSITION = 300;
const MAX_VELOCITY = 15;
const MAX_ACCELERATION = 1;
const MAX_FLOW = 3;
const RIVER_VELOCITY = .2;
const RIVER_WIDTH = 252;
const RIVER_HEIGHT = 262;
const LAND_WIDTH = 42;
const CURRENT_WIDTH = RIVER_WIDTH / 4;

// how much rotating the spinner changes acceleration/flow
const ACCELERATION_FACTOR = 0.01;
const FLOW_FACTOR = 0.1;

// multiply by this each frame to trend towards 0
const DELOCITY_FACTOR = 0.95;
const DECELERATION_FACTOR = 0.98;
const DEFLOW_FACTOR = 0.95;

const currentState = {
  position: 0,
  velocity: 0,
  acceleration: 0,
  flow: 1,
  flowMultiplier: 1,
};

/// platform constants
const CURSOR_SIZE = 50;
const DUCK_SIZE = 15; 
const PLATFORM_SIZE = 50;
const MAX_CURSOR_X = RIVER_WIDTH - CURSOR_SIZE;
const MAX_CURSOR_Y = RIVER_HEIGHT - CURSOR_SIZE;
const CURSOR_ACCELERATION = 0.5;
const CURSOR_DECELERATION = 0.95;

type PlatformProps = {
  x: number;
  y: number;
  velocity: number;
  element: HTMLDivElement | null;
};

const platformState: {
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
  platformsInRiver: PlatformProps[];
  canPlace: boolean;
} = {
  velocityX: 0,
  velocityY: 0,
  x: 0,
  y: 0,
  platformsInRiver: [],
  canPlace: true,
};

type DuckProps = {
  x: number;
  y: number;
  element: HTMLDivElement;
  state: 'waiting' | 'crossing' | 'startingJump' | 'jumping' | 'finished';
  currentPlatform?: number;
  nextPlatform?: number;
};

const ducksState: {
  canSpawn: boolean;
  ducks: DuckProps[];
} = {
  canSpawn: true,
  ducks: []
};

// duck constants
const JUMP_DISTANCE = PLATFORM_SIZE / 2 + 2.5; //27.5
const SPAWN_X = 14;
const SPAWN_Y = 30;

//---------
// HELPERS

const clamp = (min: number, current: number, max: number) => {
  return Math.max(Math.min(current, max), min);
};


//--------------
// RIVER CURRENT LOGIC

const handleCurrent = () => {
  // handle spinner inputs
  const accelerationSpinnerDelta = SPINNER_1.SPINNER.step_delta;
  const flowSpinnerDelta = SPINNER_2.SPINNER.step_delta;

  // bounded acceleration changed by spinner [-10, 10]
  currentState.acceleration = Math.min(
    Math.max(
      currentState.acceleration +
        accelerationSpinnerDelta * ACCELERATION_FACTOR,
      -MAX_ACCELERATION
    ),
    MAX_ACCELERATION
  );

  // acceleration "gravitates" towards 0
  currentState.acceleration *= DECELERATION_FACTOR;

  // velocity bounded by [-50, 50]
  currentState.velocity = Math.min(
    Math.max(currentState.velocity + currentState.acceleration, -MAX_VELOCITY),
    MAX_VELOCITY
  );

  // velocity "gravitates" towards 0
  currentState.velocity *= DELOCITY_FACTOR;

  // position bounded by [0, 300]
  currentState.position = Math.min(
    Math.max(currentState.position + currentState.velocity, 0),
    MAX_POSITION
  );

  // reset velocity + acceleration at edges
  if (currentState.position === 0 || currentState.position === MAX_POSITION) {
    currentState.velocity = 0;
    currentState.acceleration = 0;
  }

  // update flow - match spinner if spinning, otherwise trend to 1
  if (flowSpinnerDelta > 0) {
    currentState.flow += Math.max(
      0,
      (1 + flowSpinnerDelta * FLOW_FACTOR - currentState.flow) / 10
    );
  } else {
    currentState.flow *= DEFLOW_FACTOR;
  }
  currentState.flow = Math.min(Math.max(currentState.flow, 1), MAX_FLOW);
};


//----------------
// PLATFORM LOGIC

const placePlatform = () => {
  if (!platformState.canPlace) return;

  const newPlatform: PlatformProps = {
    x: 0,
    y: 0,
    velocity: RIVER_VELOCITY,
    element: null
  };

  newPlatform.x = platformState.x;
  newPlatform.y = platformState.y;

  cursor.classList.add("isPlacing")

  setTimeout(() => {
    cursor.classList.remove("isPlacing")
  }, 250)

  const platform = document.createElement("div");
  platform.style.transform = `translateX(${newPlatform.x}px) translateY(${newPlatform.y}px)`;
  platform.className = "platform";
  newPlatform["element"] = platform;

  platforms.appendChild(platform);
  platformState.platformsInRiver.push(newPlatform);
};

const isColliding = () => {
  const platforms = platformState.platformsInRiver
  const cursorRadius = CURSOR_SIZE/2
  const platformRadius = PLATFORM_SIZE/2
  for (const platform of platforms) {
    const distanceX = platformState.x + cursorRadius - (platform.x + platformRadius)
    const distanceY = platformState.y + cursorRadius - (platform.y + platformRadius)
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    if (distance < (cursorRadius + platformRadius)) return true
  }
  return false
}

const handlePlatforms = () => {

  platformState.canPlace = !isColliding()

  // Set state of cursor
  if (platformState.canPlace) {
    cursor.classList.remove("isDisabled")
  } else {
    cursor.classList.add("isDisabled")
  }

  if (PLAYER_1.DPAD.up && PLAYER_2.DPAD.up) {
    platformState.velocityY -= CURSOR_ACCELERATION;
  } else if (PLAYER_1.DPAD.down && PLAYER_2.DPAD.down) {
    platformState.velocityY += CURSOR_ACCELERATION;
  } else if (PLAYER_1.DPAD.left && PLAYER_2.DPAD.left) {
    platformState.velocityX -= CURSOR_ACCELERATION;
  } else if (PLAYER_1.DPAD.right && PLAYER_2.DPAD.right) {
    platformState.velocityX += CURSOR_ACCELERATION;
  } else if (PLAYER_1.DPAD.right && PLAYER_2.DPAD.left) {
    placePlatform();
  } else if (PLAYER_1.DPAD.left && PLAYER_2.DPAD.right) {
    // spawnDuck(); // for debugging duck spawning
  }

  platformState.velocityX *= CURSOR_DECELERATION;
  platformState.velocityY *= CURSOR_DECELERATION;

  platformState.x = clamp(
    0,
    platformState.x + platformState.velocityX,
    MAX_CURSOR_X
  );
  platformState.y = clamp(
    0,
    platformState.y + platformState.velocityY,
    MAX_CURSOR_Y
  );
};


//------------
// DUCK LOGIC

const spawnDuck = () => {
  ducksState.canSpawn = false;
  const duckEl = document.createElement("div");
  
  const newDuck: DuckProps = {
    x: SPAWN_X,
    y: SPAWN_Y,
    state: 'waiting',
    element: duckEl,
  };

  duckEl.className = "duck";
  duckEl.style.transform = `translateX(${newDuck.x}px) translateY(${newDuck.y}px)`;
  duckEl.innerText = `${ducksState.ducks.length + 1}`
  ducks.appendChild(duckEl);
  duckEl.ontransitionstart = (event: TransitionEvent) => {
    if (event.propertyName === 'transform') {
      newDuck.state = 'jumping'
      console.log(`Duck #${ducksState.ducks.length} jumped!`, event)
    }
  }
  duckEl.ontransitionend = (event: TransitionEvent) => {
    if (event.propertyName === 'transform') {
      newDuck.state = 'crossing'
      console.log(`Duck #${ducksState.ducks.length} stopped!`, event)
    }
  }

  // update duck state
  ducksState.ducks.push(newDuck);
  console.log('Spawned duck #', ducksState.ducks.length)
}

const tryToJump = (duck: DuckProps) => {
  if(duck.x > LAND_WIDTH + RIVER_WIDTH - JUMP_DISTANCE) {
    // End
    duck.state = 'finished';
    duck.x = LAND_WIDTH + RIVER_WIDTH + SPAWN_X;
    return;
  }

  for(const [i, platform] of platformState.platformsInRiver.entries()) {
    if (duck.currentPlatform === i) continue
    if (duck.x > platform.x) continue
    const distanceX = duck.x + JUMP_DISTANCE - (platform.x + PLATFORM_SIZE / 2);
    const distanceY = duck.y + JUMP_DISTANCE - (platform.y + PLATFORM_SIZE / 2);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    // const consoleObj = {
    //   distanceX,
    //   distanceY,
    //   distance,
    //   JUMP_DISTANCE,
    // }
    // console.log(consoleObj)
    // const dateNow:number = new Date().getTime();

    if(duck.state !== 'jumping' && distance < (JUMP_DISTANCE + PLATFORM_SIZE / 2)) {
      duck.currentPlatform = i;
      // if(!(dateNow - last_embark < 3000 && duck.state === 'waiting')){
      duckGoJump(duck, platform);
      // }
      return;
    }
  }
}

let last_embark:number = new Date().getTime();
const duckGoJump = (duck: DuckProps, platform: PlatformProps) => {
  // allow spawning if the duck that is jumping is the spawn duck
  if(duck.x === SPAWN_X && duck.y === SPAWN_Y) {
    // setTimeout(() => { ducksState.canSpawn = true}, 150);
  }
  // Keep x,y the same between duck and platform for logic purposes
  // Use CSS to offset display
  duck.x = platform.x; // duck.x + JUMP_DISTANCE - DUCK_SIZE / 2;
  duck.y = platform.y;
  if (duck.state === 'waiting') {
    last_embark = new Date().getTime();
  }
  duck.state = 'startingJump';
}

const handleDucks = () => {
  ducksState.canSpawn = true;
  for(const duck of ducksState.ducks) {
    tryToJump(duck);
    if(duck.state === 'waiting'){
      ducksState.canSpawn = false;
    }
  }
  const dateNow:number = new Date().getTime();
  if(ducksState.canSpawn && dateNow - last_embark > 3000) {
    spawnDuck()
  }
}

//-----------
// DOM LOGIC

const updateDOM = () => {
  current.style.transform = `translateX(${currentState.position}%)`;
  flow.style.height = `${((currentState.flow - 1) / (MAX_FLOW - 1)) * 100}%`;
  cursor_container.style.transform = `translateX(${platformState.x}px) translateY(${platformState.y}px)`;
  updatePlatformsDOM();
  updateDucksDOM();
};

const updatePlatformsDOM = () => {
  const garbage: number[] = []
  const platforms = platformState.platformsInRiver
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i]
    if (platform.y > RIVER_HEIGHT) {
      garbage.push(i)
      platform.element!.remove()
      continue
    }
    const element = platform.element
    platform.y += RIVER_VELOCITY
    element!.style.transform = `translateX(${platform.x}px) translateY(${platform.y}px)`
  }
  platforms.filter((_, i) => { garbage.includes(i) })
}

const updateDucksDOM = () => {
  const garbage: number[] = [];
  const ducks = ducksState.ducks
  for (const [i, duck] of ducks.entries()) {
    const currPlat = platformState.platformsInRiver[duck.currentPlatform!]
    if (duck.y > RIVER_HEIGHT) {
      garbage.push(i)
      duck.element!.remove()
      continue
    }
    if (duck.currentPlatform) {
      duck.y = currPlat.y + PLATFORM_SIZE/2
    }
    
    if (duck.state === 'startingJump') {
      duck.element.style.transform = `translateX(${duck.x}px) translateY(${duck.y}px)`;
    } 
    // else if (duck.state !== 'jumping' && duck.x === currPlat.x) {
      
    // }
    duck.element.dataset.state = duck.state
  }
  ducks.filter((_, i) => { garbage.includes(i) })
}

//------------------
// MAIN UPDATE LOOP

function update() {
  handleCurrent();
  handlePlatforms();
  handleDucks();
  updateDOM();

  // debug
  // console.log(JSON.stringify(currentState));
  // console.log(JSON.stringify(platformState));

  requestAnimationFrame(update);
}

update();
