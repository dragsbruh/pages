// obligatory mention: https://github.com/adryd325/oneko.js

let x = 0;
let y = 0;

let mouseX = 0;
let mouseY = 0;

const speed = 10;

const minDistance = 32;
const maxDistance = 64;

const spriteSheet = {
  idle: [[3, 3]],
  tired: [[3, 2]],
  alert: [[7, 3]],
  sleeping: [[2, 0], [2, 1]],

  scratchWallN: [[0, 0], [0, 1]],
  scratchWallS: [[7, 1], [6, 2]],
  scratchWallE: [[2, 2], [2, 3]],
  scratchWallW: [[4, 0], [4, 1]],

  scratchSelf: [[5, 0], [6, 0], [7, 0]],

  moveN: [[1, 2], [1, 3]],
  moveNE: [[0, 2], [0, 3]],
  moveE: [[3, 0], [3, 1]],
  moveSE: [[5, 1], [5, 2]],
  moveS: [[6, 3], [7, 2]],
  moveSW: [[5, 3], [6, 1]],
  moveW: [[4, 2], [4, 3]],
  moveNW: [[1, 0], [1, 1]],
};


/** @typedef {keyof typeof spriteSheet} Animation */
/** @typedef {"tired" | "sleeping" | "moving" | "idle" | "deepIdle" | "alert"} State */

/** @type {State} */
let state = "idle";
/** @type {Animation | null} */
let idleAnim = null;
let animCounter = 0;

let el = document.createElement("div");

el.id = "oneko";
el.style.width = "32px";
el.style.height = "32px";
el.style.position = "fixed";
el.style.pointerEvents = "none";
el.style.backgroundImage = "url(/oneko/classic.gif)";

/**
* @param {number} newX
* @param {number} newY
*/
function setPos(newX, newY) {
  x = newX;
  y = newY;

  el.style.left = `${x - 16}px`;
  el.style.top = `${y - 16}px`;
}

/**
* @param {Animation} name
* @param {number} idx
*/
function setSprite(name, idx) {
  const animation = spriteSheet[name];
  const frame = animation[idx % animation.length];
  el.style.backgroundPosition = `${frame[0] * -32}px ${frame[1] * -32}px`;
}

/**
* @param {State} name
*/
function setState(name) {
  state = name;
  animCounter = 0;
}

// -----------

function tickFrame() {
  const distance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2) || 0.001;

  switch (state) {
    case "tired":
      setSprite("tired", 0);
      if (distance > maxDistance) {
        setState("alert");
      } else if (animCounter > 16) {
        setState("sleeping");
      }
      break;
    case "alert":
      setSprite("alert", 0);
      if (distance <= maxDistance) {
        setState("idle");
      } else if (animCounter > 16) {
        setState("moving");
      }
      break;
    case "sleeping":
      setSprite("sleeping", Math.floor(animCounter / 4));
      if (distance > maxDistance) {
        setState("alert");
      }
      break;
    case "moving":
      if (distance <= minDistance) {
        setState("idle");
      } else {
        let direction = "move";
        direction += (y - mouseY) / distance > 0.5 ? "N" : "";
        direction += (y - mouseY) / distance < -0.5 ? "S" : "";
        direction += (x - mouseX) / distance > 0.5 ? "W" : "";
        direction += (x - mouseX) / distance < -0.5 ? "E" : "";
        setSprite(direction, Math.floor(animCounter / 2));

        x -= speed * (x - mouseX) / distance;
        y -= speed * (y - mouseY) / distance;

        x = Math.min(Math.max(16, x), window.innerWidth - 16);
        y = Math.min(Math.max(16, y), window.innerHeight - 16);

        setPos(x, y);
      }

      break;
    case "idle":
      setSprite("idle", 0);

      if (distance > maxDistance) {
        setState("alert");
      } else if (animCounter > 32) {
        /** @type {Animation[]} */
        const available = ["sleeping", "scratchSelf"];
        if (x < 32) available.push("scratchWallW")
        if (y < 32) available.push("scratchWallN");
        if (x > window.innerWidth - 32) available.push("scratchWallE");
        if (y > window.innerHeight - 32) available.push("scratchWallS");

        idleAnim = available[Math.floor(Math.random() * available.length)];
        setState("deepIdle");
      }
      break;
    case "deepIdle":
      if (!idleAnim) {
        setState("idle");
        break;
      }

      setSprite(idleAnim, Math.floor(animCounter / 4));
      if (distance > maxDistance) {
        setState("alert");
      } else if (animCounter > 64 && idleAnim !== "sleeping") {
        setState("idle");
      }
      break;
  }

  animCounter++;
}

// --------------

let lastTimestamp = 0;

/**
* @param {number} timestamp
*/
function process(timestamp) {
  if (!el.isConnected) return;
  if (!lastTimestamp) lastTimestamp = timestamp;

  while (timestamp - lastTimestamp >= 100) {
    lastTimestamp += 100;
    tickFrame();
  }

  window.requestAnimationFrame(process);
}

// ------------

document.addEventListener("DOMContentLoaded", () => {
  const data = localStorage.getItem("oneko");
  if (data) {
    const params = JSON.parse(data);
    if (typeof params.x === "number") x = params.x;
    if (typeof params.y === "number") y = params.y;
  } else {
    x = (window.innerWidth / 2) - 16;
    y = (window.innerHeight / 2) - 16;
  }

  mouseX = x;
  mouseY = y;

  setPos(x, y);
  setSprite("idle", 0);
  document.body.appendChild(el);

  window.requestAnimationFrame(process);
});

document.addEventListener("mousemove", (ev) => {
  mouseX = ev.clientX;
  mouseY = ev.clientY;
})

window.addEventListener("beforeunload", () => {
  localStorage.setItem("oneko", JSON.stringify({ x: x, y: y }));
})
