import "./style.css";
import { PLAYER_1, PLAYER_2 } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as SPINNER_1,
  PLAYER_2 as SPINNER_2,
} from "@rcade/plugin-input-spinners";

const app = document.querySelector<HTMLDivElement>("#app")!;
const current = document.querySelector<HTMLDivElement>("#current")!;
const flow = document.querySelector<HTMLDivElement>("#flow")!;
const cursor_container = document.querySelector<HTMLDivElement>("#cursor-container")!;
const cursor = document.querySelector<HTMLDivElement>("#cursor")!;
const platforms = document.querySelector<HTMLDivElement>("#platforms")!;

let gameStarted = false;

/// current constants
// bounds
const MAX_POSITION = 300;
const MAX_VELOCITY = 15;
const MAX_ACCELERATION = 1;
const MAX_FLOW = 3;

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
const PLATFORM_SIZE = 50;
const MAX_CURSOR_X = 252 - CURSOR_SIZE;
const MAX_CURSOR_Y = 262 - CURSOR_SIZE;
const CURSOR_ACCELERATION = 0.5;
const CURSOR_DECELERATION = 0.95;

type PlatformProps = {
  x: number;
  y: number;
  velocity: number;
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

/// helper functions
const clamp = (min: number, current: number, max: number) => {
  return Math.max(Math.min(current, max), min);
};

/// current functions
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

/// platform functions
// const cursorObserver = new IntersectionObserver(
//   (entries) => {
//     console.log(entries);

//     platformState.canPlace =
//       entries.filter(
//         (entry) => entry.isIntersecting && entry.target.className === "platform"
//       ).length === 0;
//   },
//   {
//     root: cursor,
//     threshold: 0,
//   }
// );

const placePlatform = () => {
  if (!platformState.canPlace) return;

  const newPlatform: PlatformProps = {
    x: 0,
    y: 0,
    velocity: 0,
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

  platforms.appendChild(platform);
  platformState.platformsInRiver.push(newPlatform);
};

const isColliding = () => {
  // check if colloding with platform
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

/// update DOM
const updateDOM = () => {
  current.style.transform = `translateX(${currentState.position}%)`;
  flow.style.height = `${((currentState.flow - 1) / (MAX_FLOW - 1)) * 100}%`;

  cursor_container.style.transform = `translateX(${platformState.x}px) translateY(${platformState.y}px)`;
};

function update() {
  handleCurrent();
  handlePlatforms();
  updateDOM();

  // debug
  // console.log(JSON.stringify(currentState));
  // console.log(JSON.stringify(platformState));

  requestAnimationFrame(update);
}

update();
