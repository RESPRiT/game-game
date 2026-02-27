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
const cursor_container =
  document.querySelector<HTMLDivElement>("#cursor-container")!;
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
const RIVER_VELOCITY = 0.2;
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
  id: number;
  x: number;
  y: number;
  velocity: number;
  element: HTMLDivElement | null;
};

const platformState: {
  platformsPlaced: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
  platformsInRiver: PlatformProps[];
  canPlace: boolean;
} = {
  platformsPlaced: 0,
  velocityX: 0,
  velocityY: 0,
  x: 0,
  y: 0,
  platformsInRiver: [],
  canPlace: true,
};

type DuckProps = {
  id: number;
  x: number;
  y: number;
  element: HTMLDivElement;
  spriteElement: HTMLDivElement;
  state: "waiting" | "crossing" | "startingJump" | "jumping" | "finished";
  currentPlatform?: number;
  nextPlatform?: number;
};

const ducksState: {
  ducksSpawned: number;
  canSpawn: boolean;
  ducks: DuckProps[];
} = {
  ducksSpawned: 0,
  canSpawn: true,
  ducks: [],
};

// duck constants
const JUMP_DISTANCE = PLATFORM_SIZE / 2 + 2.5; //27.5
const SPAWN_X = -30;
const SPAWN_Y = 10;

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
      -MAX_ACCELERATION,
    ),
    MAX_ACCELERATION,
  );

  // acceleration "gravitates" towards 0
  currentState.acceleration *= DECELERATION_FACTOR;

  // velocity bounded by [-50, 50]
  currentState.velocity = Math.min(
    Math.max(currentState.velocity + currentState.acceleration, -MAX_VELOCITY),
    MAX_VELOCITY,
  );

  // velocity "gravitates" towards 0
  currentState.velocity *= DELOCITY_FACTOR;

  // position bounded by [0, 300]
  currentState.position = Math.min(
    Math.max(currentState.position + currentState.velocity, 0),
    MAX_POSITION,
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
      (1 + flowSpinnerDelta * FLOW_FACTOR - currentState.flow) / 10,
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
  platformState.platformsPlaced++;
  const newPlatform: PlatformProps = {
    id: platformState.platformsPlaced,
    x: 0,
    y: 0,
    velocity: RIVER_VELOCITY,
    element: null,
  };

  newPlatform.x = platformState.x;
  newPlatform.y = platformState.y;

  cursor.classList.add("isPlacing");

  setTimeout(() => {
    cursor.classList.remove("isPlacing");
  }, 250);

  const platform = document.createElement("div");
  platform.style.transform = `translateX(${newPlatform.x}px) translateY(${newPlatform.y}px)`;
  platform.className = "platform";
  platform.innerText = "" + newPlatform.id;
  newPlatform["element"] = platform;

  platforms.appendChild(platform);
  platformState.platformsInRiver.push(newPlatform);
};

const isColliding = () => {
  const platforms = platformState.platformsInRiver;
  const cursorRadius = CURSOR_SIZE / 2;
  const platformRadius = PLATFORM_SIZE / 2;
  for (const platform of platforms) {
    const distanceX =
      platformState.x + cursorRadius - (platform.x + platformRadius);
    const distanceY =
      platformState.y + cursorRadius - (platform.y + platformRadius);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    if (distance < cursorRadius + platformRadius) return true;
  }
  return false;
};

const handlePlatforms = () => {
  platformState.canPlace = !isColliding();

  // Set state of cursor
  if (platformState.canPlace) {
    cursor.classList.remove("isDisabled");
  } else {
    cursor.classList.add("isDisabled");
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
    MAX_CURSOR_X,
  );
  platformState.y = clamp(
    0,
    platformState.y + platformState.velocityY,
    MAX_CURSOR_Y,
  );
};

//------------
// DUCK LOGIC

const spawnDuck = () => {
  ducksState.canSpawn = false;
  const duckEl = document.createElement("div");
  const spriteEl = document.createElement("div");
  spriteEl.className = "duck_sprite";
  duckEl.appendChild(spriteEl);
  ducksState.ducksSpawned++;

  const newDuck: DuckProps = {
    id: ducksState.ducksSpawned,
    x: SPAWN_X,
    y: SPAWN_Y,
    state: "waiting",
    element: duckEl,
    spriteElement: spriteEl,
  };

  duckEl.className = "duck_container";
  duckEl.style.transform = `translateX(${newDuck.x}px) translateY(${newDuck.y}px)`;
  spriteEl.innerText = `${newDuck.id}`;
  spriteEl.ontransitionstart = (event: TransitionEvent) => {
    console.log("Transition start", event.propertyName)
    if (event.propertyName === "top" || event.propertyName === "left") {
      newDuck.state = "jumping";
      console.log(`Duck #${newDuck.id} jumped!`, event);
    }
  };
  spriteEl.ontransitionend = (event: TransitionEvent) => {
    console.log("Transition end", event.propertyName)
    if (event.propertyName === "top" || event.propertyName === "left") {
      newDuck.state = "crossing";
      console.log(`Duck #${newDuck.id} stopped!`, event);
    }
  };
  ducks.appendChild(duckEl);

  // update duck state
  ducksState.ducks.push(newDuck);
  console.log("Spawned duck #", ducksState.ducks.length);
};

const tryToJump = (duck: DuckProps) => {
  if (platformState.platformsInRiver.length === 0) {
    return;
  }
  // FIXME: with new approach, we don't get to "finished"
  if (duck.x > LAND_WIDTH + RIVER_WIDTH - JUMP_DISTANCE) {
    // End
    duck.state = "finished";
    duck.x = LAND_WIDTH + RIVER_WIDTH + SPAWN_X;
    return;
  }

  
  let closestPlatform: number = -1;
  let closestDistance: number = 10000;
  for (const [i, platform] of platformState.platformsInRiver.entries()) {
    // Our duck is currently on i, ignore platform
    if (duck.currentPlatform === platform.id) {
      // console.log(
      //   `duck #${duck.id} current platform ${duck.currentPlatform} is #${platform.id}`,
      // );
      continue;
    }

    // If the platform is to the left of the duck, ignore platform
    if (duck.x - 12 > platform.x && duck.state !== "waiting") {
      console.log(
        `duck #${duck.element.innerText} x: ${duck.x} > platform #${i} x: ${platform.x}`,
      );
      continue;
    }
    //TODO: we maybe shouldn't have ducks jump up stream very far?
    // if so we would need to place some sort of limit on the distanceY they can go
    const distanceX = duck.x + JUMP_DISTANCE - (platform.x + PLATFORM_SIZE / 2);
    //if distancey is negative, platform is below. if it's positive, it's above
    const distanceY = duck.y + JUMP_DISTANCE - (platform.y + PLATFORM_SIZE / 2);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    console.log("distance to platform", distance);
    if (closestDistance > distance) {
      closestDistance = distance;
      closestPlatform = platform.id;
    }
  }
  if (
    closestPlatform != -1 &&
    duck.state !== "jumping" &&
    closestDistance < JUMP_DISTANCE + PLATFORM_SIZE / 2
  ) {
    console.log("jump to", closestPlatform);

    duck.currentPlatform = closestPlatform;
    const curPlatProp = platformState.platformsInRiver.find(
      (platform) => platform.id === duck.currentPlatform,
    )!!;
    duckGoJump(duck, curPlatProp);
  }
};

let last_embark: number = new Date().getTime();
const duckGoJump = (duck: DuckProps, platform: PlatformProps) => {
  // allow spawning if the duck that is jumping is the spawn duck
  if (duck.x === SPAWN_X && duck.y === SPAWN_Y) {
    // setTimeout(() => { ducksState.canSpawn = true}, 150);
  }
  // Keep x,y the same between duck and platform for logic purposes
  // Use CSS to offset display
  const oldX = duck.x
  const oldY = duck.y
  duck.x = platform.x; // duck.x + JUMP_DISTANCE - DUCK_SIZE / 2;
  duck.y = platform.y;
  if (duck.state === "waiting") {
    last_embark = new Date().getTime();
  }
  duck.state = "startingJump";
  duck.spriteElement.style.top = `${oldY - duck.y + 15}px`
  duck.spriteElement.style.left = `${oldX - duck.x + 15}px`
  // console.log(duck.spriteElement.style.top, duck.spriteElement.style.left)
  // duck.spriteElement.style.transition = 'all 0.075s ease-in-out'
  // duck.spriteElement.style.top = `15px`
  // duck.spriteElement.style.left = `15px`
};

const handleDucks = () => {
  ducksState.canSpawn = true;
  for (const duck of ducksState.ducks) {
    tryToJump(duck);
    if (duck.state === "waiting") {
      ducksState.canSpawn = false;
    }
  }
  const dateNow: number = new Date().getTime();
  if (ducksState.canSpawn && dateNow - last_embark > 3000) {
    spawnDuck();
  }
};

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
  const garbage: number[] = [];
  const platforms = platformState.platformsInRiver;
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    if (platform.y > RIVER_HEIGHT) {
      // Push the current index of platform in platformState.platformsInRiver for future collection
      garbage.push(platform.id);
      continue;
    }
    const element = platform.element;
    platform.y += RIVER_VELOCITY;
    element!.style.transform = `translateX(${platform.x}px) translateY(${platform.y}px)`;
  }
  if (garbage.length > 0) {
    platformState.platformsInRiver = platformState.platformsInRiver.filter(
      (platform, _) => !garbage.includes(platform.id),
    );
    // for (let i = 0; i < garbage.length; i++) {
    // const g = garbage[i]
    // const el = platformState.platformsInRiver[g].element?.remove()
    // platformState.platformsInRiver.slice
    // }
  }
};

function getPlatform(id:number):PlatformProps | undefined{
  return platformState.platformsInRiver.find((platform)=> platform.id === id);
}

const updateDucksDOM = () => {
  const garbage: number[] = [];
  const ducks = ducksState.ducks;
  for (const [_, duck] of ducks.entries()) {
    //Remove duck
    if (duck.y > RIVER_HEIGHT) {
      garbage.push(duck.id);
      duck.element!.remove();
      continue;
    }

    // If duck isn't on platform ignore
    if (!duck.currentPlatform) continue
    
    // The platform our duck is on
    const currPlat = getPlatform(duck.currentPlatform);
    if (!currPlat) continue
    // console.log("Update Ducks DOM: ", duck.currentPlatform, currPlat)

    if (duck.state !== "waiting" && duck.state !== "finished") {
      // Duck and Platform coordinates should match
      duck.y = currPlat.y;
      duck.x = currPlat.x;
      duck.element.style.transform = `translateY(${duck.y}px) translateX(${duck.x}px)`;
      // duck.spriteElement.style.transform  = `translateY(${duck.y}px) translateX(${duck.x}px)`;
    }

    // if (duck.state === "startingJump") {
    //   duck.element.style.transform = `translateX(${duck.x}px) translateY(${duck.y}px)`;
    // }
    // else if (duck.state !== 'jumping' && duck.x === currPlat.x) {

    // }
    duck.element.dataset.state = duck.state;
  }
  if (garbage.length > 0) {
    ducksState.ducks = ducksState.ducks.filter(
      (duck, _) => !garbage.includes(duck.id),
    );
  }
};

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
