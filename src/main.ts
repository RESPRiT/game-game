import "./style.css";
import { PLAYER_1, PLAYER_2 } from "@rcade/plugin-input-classic";
import {
  PLAYER_1 as SPINNER_1,
  PLAYER_2 as SPINNER_2,
} from "@rcade/plugin-input-spinners";

const app = document.querySelector<HTMLDivElement>("#app")!;
const current = document.querySelector<HTMLDivElement>("#current")!;
const flow = document.querySelector<HTMLDivElement>("#flow")!;

let gameStarted = false;

// bounds
let MAX_VELOCITY = 15;
let MAX_ACCELERATION = 1;
let MAX_FLOW = 3;

// how much rotating the spinner changes acceleration/flow
let ACCELERATION_FACTOR = 0.01;
let FLOW_FACTOR = 0.1;

// multiply by this each frame to trend towards 0
let DELOCITY_FACTOR = 0.95;
let DECELLERATION_FACTOR = 0.98;
let DEFLOW_FACTOR = 0.95;

let currentState = {
  position: 0,
  velocity: 0,
  acceleration: 0,
  flow: 1,
  flowMultiplier: 1,
};

let last = (document.timeline.currentTime as number) ?? 0;
function update(timestamp: number) {
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

  //// current update logic
  // multiplier that is ~1 at 60fps
  const rate = (timestamp - last) / ((1 / 60) * 1000);

  // handle spinner inputs
  const accelerationSpinnerDelta = SPINNER_1.SPINNER.step_delta * rate;
  const flowSpinnerDelta = SPINNER_2.SPINNER.step_delta * rate;

  // update position, velocity

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
  currentState.acceleration *= DECELLERATION_FACTOR * rate;

  // velocity bounded by [-50, 50]
  currentState.velocity = Math.min(
    Math.max(currentState.velocity + currentState.acceleration, -MAX_VELOCITY),
    MAX_VELOCITY
  );

  // velocity "gravitates" towards 0
  currentState.velocity *= DELOCITY_FACTOR * rate;

  // position bounded by [0, 300]
  currentState.position = Math.min(
    Math.max(currentState.position + currentState.velocity, 0),
    300
  );

  // reset velocity + acceleration at edges
  if (currentState.position === 0 || currentState.position === 300) {
    currentState.velocity = 0;
    currentState.acceleration = 0;
  }

  // update flow - match spinner if spinning, otherwise trend to 1

  if (flowSpinnerDelta !== 0) {
    currentState.flow += Math.max(
      0,
      (1 + flowSpinnerDelta * FLOW_FACTOR - currentState.flow) / 10
    );
  } else {
    currentState.flow *= DEFLOW_FACTOR * rate;
  }
  currentState.flow = Math.min(Math.max(currentState.flow, 1), MAX_FLOW);

  // update DOM
  current.style.transform = `translateX(${currentState.position}%)`;
  flow.style.height = `${((currentState.flow - 1) / (MAX_FLOW - 1)) * 100}%`;

  console.log(JSON.stringify(currentState));

  last = timestamp;
  requestAnimationFrame(update);
}

update(last);
