import "./style.css";
import { PLAYER_1, PLAYER_2 } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as SPINNER_1,
  PLAYER_2 as SPINNER_2,
} from "@rcade/plugin-input-spinners";

const app = document.querySelector<HTMLDivElement>("#app")!;
const current = document.querySelector<HTMLDivElement>("#current")!;
const flow = document.querySelector<HTMLDivElement>("#flow")!;
const cursor = document.querySelector<HTMLDivElement>("#cursor")!;

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
const DECELLERATION_FACTOR = 0.98;
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
const MAX_CURSOR_X = 252 - CURSOR_SIZE;
const MAX_CURSOR_Y = 262 - CURSOR_SIZE;
const CURSOR_STEP = 1;

const platformState = {
  x: 0,
  y: 0,
  platformsInRiver: [],
  canPlace: false,
};

const clamp = (min: number, current: number, max: number) => {
  return Math.max(Math.min(current, max), min);
};

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
  currentState.acceleration *= DECELLERATION_FACTOR;

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

const handlePlatforms = () => {
  //
  if (PLAYER_1.DPAD.up && PLAYER_2.DPAD.up) {
    platformState.y -= CURSOR_STEP;
  } else if (PLAYER_1.DPAD.down && PLAYER_2.DPAD.down) {
    platformState.y += CURSOR_STEP;
  } else if (PLAYER_1.DPAD.left && PLAYER_2.DPAD.left) {
    platformState.x -= CURSOR_STEP;
  } else if (PLAYER_1.DPAD.right && PLAYER_2.DPAD.right) {
    platformState.x += CURSOR_STEP;
  } else if (PLAYER_1.DPAD.right && PLAYER_2.DPAD.left) {
  }

  console.log(PLAYER_1.DPAD, PLAYER_2.DPAD);
  platformState.x = clamp(0, platformState.x, MAX_CURSOR_X);
  platformState.y = clamp(0, platformState.y, MAX_CURSOR_Y);
};

const updateDOM = () => {
  // update DOM
  current.style.transform = `translateX(${currentState.position}%)`;
  flow.style.height = `${((currentState.flow - 1) / (MAX_FLOW - 1)) * 100}%`;

  cursor.style.transform = `translateX(${platformState.x}px) translateY(${platformState.y}px)`;
};

function update() {
  //   if (!gameStarted) {
  //     if (SYSTEM.ONE_PLAYER) {
  //       gameStarted = true;
  //       status.textContent = "Game Started!";
  //     }
  //   } else {
  //     const inputs: string[] = [];
  //     if (PLAYER_1.DPAD.up) inputs.push("↑");
  //     if (PLAYER_1.DPAD.down) inputs.push("↓");
  //     if (PLAYER_1.DPAD.left) inputs.push("←");
  //     if (PLAYER_1.DPAD.right) inputs.push("→");
  //     if (PLAYER_1.A) inputs.push("A");
  //     if (PLAYER_1.B) inputs.push("B");

  //     controls.textContent = inputs.length > 0 ? inputs.join(" ") : "-";
  //   }

  handleCurrent();
  handlePlatforms();
  updateDOM();

  // debug
  console.log(JSON.stringify(currentState));
  console.log(JSON.stringify(platformState));

  requestAnimationFrame(update);
}

update();
