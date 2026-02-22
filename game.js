const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const heartsText = document.getElementById("heartsText");
const waveText = document.getElementById("waveText");
const enemiesLeftText = document.getElementById("enemiesLeftText");
const shurikenText = document.getElementById("shurikenText");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const swordBtn = document.getElementById("swordBtn");
const shurikenBtn = document.getElementById("shurikenBtn");
const dpad = document.getElementById("dpad");

const WORLD = {
  width: canvas.width,
  height: canvas.height,
};

const TOTAL_WAVES = 5;
const ENEMIES_PER_WAVE = 30;
const STARTING_HEARTS = 3;
const ENEMY_HEART_DAMAGE = 0.1;
const SHURIKEN_PER_WAVE = 30;

const state = {
  running: false,
  gameOver: false,
  victory: false,
  wave: 1,
  hearts: STARTING_HEARTS,
  shuriken: SHURIKEN_PER_WAVE,
  enemiesRemainingToSpawn: ENEMIES_PER_WAVE,
  enemiesDefeatedThisWave: 0,
  enemies: [],
  projectiles: [],
  swordSwingTimer: 0,
  spawnTimer: 0,
  spawnCooldownMs: 700,
  lastTimestamp: 0,
  input: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
  player: {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    radius: 16,
    speed: 235,
    facingX: 1,
    facingY: 0,
    invulnMs: 0,
  },
};

function resetGame() {
  state.running = true;
  state.gameOver = false;
  state.victory = false;
  state.wave = 1;
  state.hearts = STARTING_HEARTS;
  state.shuriken = SHURIKEN_PER_WAVE;
  state.enemiesRemainingToSpawn = ENEMIES_PER_WAVE;
  state.enemiesDefeatedThisWave = 0;
  state.enemies = [];
  state.projectiles = [];
  state.swordSwingTimer = 0;
  state.spawnTimer = 0;
  state.spawnCooldownMs = waveSpawnCooldown(state.wave);
  state.lastTimestamp = 0;
  state.player.x = WORLD.width / 2;
  state.player.y = WORLD.height / 2;
  state.player.facingX = 1;
  state.player.facingY = 0;
  state.player.invulnMs = 0;
  overlay.classList.remove("active");
  updateHud();
}

function waveSpawnCooldown(wave) {
  return Math.max(300, 760 - wave * 80);
}

function updateHud() {
  heartsText.textContent = `${Math.max(0, state.hearts).toFixed(1)} / ${STARTING_HEARTS}`;
  waveText.textContent = `${state.wave} / ${TOTAL_WAVES}`;
  const remaining = ENEMIES_PER_WAVE - state.enemiesDefeatedThisWave;
  enemiesLeftText.textContent = String(Math.max(0, remaining));
  shurikenText.textContent = String(state.shuriken);
}

function showOverlay(title, message, buttonText = "Restart") {
  overlay.classList.add("active");
  overlay.innerHTML = `
    <div class="overlay-card">
      <h1>${title}</h1>
      <p>${message}</p>
      <button id="startBtn" class="primary-btn">${buttonText}</button>
    </div>
  `;
  overlay.querySelector("#startBtn").addEventListener("click", () => {
    resetGame();
  });
}

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = Math.random() * WORLD.width;
    y = -16;
  } else if (edge === 1) {
    x = WORLD.width + 16;
    y = Math.random() * WORLD.height;
  } else if (edge === 2) {
    x = Math.random() * WORLD.width;
    y = WORLD.height + 16;
  } else {
    x = -16;
    y = Math.random() * WORLD.height;
  }

  state.enemies.push({
    x,
    y,
    radius: 14,
    speed: 62 + state.wave * 9 + Math.random() * 8,
    touchCooldownMs: 0,
  });
}

function swingSword() {
  if (!state.running) return;
  state.swordSwingTimer = 180;
  const range = 56;

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= range) {
      state.enemies.splice(i, 1);
      state.enemiesDefeatedThisWave += 1;
    }
  }
  updateHud();
}

function throwShuriken() {
  if (!state.running || state.shuriken <= 0) return;

  let fx = state.player.facingX;
  let fy = state.player.facingY;
  if (fx === 0 && fy === 0) {
    fx = 1;
    fy = 0;
  }

  const len = Math.hypot(fx, fy) || 1;
  fx /= len;
  fy /= len;

  state.projectiles.push({
    x: state.player.x + fx * (state.player.radius + 8),
    y: state.player.y + fy * (state.player.radius + 8),
    vx: fx * 520,
    vy: fy * 520,
    radius: 6,
    lifeMs: 900,
  });

  state.shuriken -= 1;
  updateHud();
}

function applyInput(dt) {
  let dx = 0;
  let dy = 0;

  if (state.input.up) dy -= 1;
  if (state.input.down) dy += 1;
  if (state.input.left) dx -= 1;
  if (state.input.right) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    state.player.facingX = dx;
    state.player.facingY = dy;

    state.player.x += dx * state.player.speed * dt;
    state.player.y += dy * state.player.speed * dt;

    state.player.x = Math.max(state.player.radius, Math.min(WORLD.width - state.player.radius, state.player.x));
    state.player.y = Math.max(state.player.radius, Math.min(WORLD.height - state.player.radius, state.player.y));
  }
}

function updateProjectiles(dtMs) {
  const dt = dtMs / 1000;
  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const p = state.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.lifeMs -= dtMs;

    if (p.lifeMs <= 0 || p.x < -20 || p.y < -20 || p.x > WORLD.width + 20 || p.y > WORLD.height + 20) {
      state.projectiles.splice(i, 1);
      continue;
    }

    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const e = state.enemies[j];
      const hit = Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius;
      if (hit) {
        // Shuriken deal full enemy damage, defeating low-level enemies instantly.
        state.enemies.splice(j, 1);
        state.projectiles.splice(i, 1);
        state.enemiesDefeatedThisWave += 1;
        updateHud();
        break;
      }
    }
  }
}

function updateEnemies(dtMs) {
  const dt = dtMs / 1000;

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const e = state.enemies[i];
    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.x += (dx / dist) * e.speed * dt;
    e.y += (dy / dist) * e.speed * dt;

    e.touchCooldownMs = Math.max(0, e.touchCooldownMs - dtMs);

    const touching = dist <= state.player.radius + e.radius;
    if (touching && e.touchCooldownMs <= 0 && state.player.invulnMs <= 0) {
      state.hearts -= ENEMY_HEART_DAMAGE;
      state.player.invulnMs = 280;
      e.touchCooldownMs = 300;
      updateHud();

      if (state.hearts <= 0) {
        state.hearts = 0;
        state.running = false;
        state.gameOver = true;
        showOverlay("Defeated", "Your home has fallen. Try again and defend all 5 waves.");
        return;
      }
    }
  }
}

function updateSpawning(dtMs) {
  if (state.enemiesRemainingToSpawn <= 0) return;
  state.spawnTimer -= dtMs;

  if (state.spawnTimer <= 0) {
    spawnEnemy();
    state.enemiesRemainingToSpawn -= 1;
    state.spawnTimer = state.spawnCooldownMs;
  }
}

function maybeAdvanceWave() {
  if (state.enemiesDefeatedThisWave < ENEMIES_PER_WAVE) return;
  if (state.enemies.length > 0) return;

  if (state.wave >= TOTAL_WAVES) {
    state.running = false;
    state.victory = true;
    showOverlay("Victory", "You defended your home through all 5 waves.", "Play Again");
    return;
  }

  state.wave += 1;
  state.shuriken = SHURIKEN_PER_WAVE;
  state.enemiesRemainingToSpawn = ENEMIES_PER_WAVE;
  state.enemiesDefeatedThisWave = 0;
  state.spawnCooldownMs = waveSpawnCooldown(state.wave);
  state.spawnTimer = 400;
  updateHud();
}

function drawBackground() {
  ctx.fillStyle = "#2f6d37";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // simple repeated grass blades
  ctx.strokeStyle = "rgba(70, 110, 62, 0.35)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD.width; x += 34) {
    for (let y = 0; y < WORLD.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + 2, y);
      ctx.stroke();
    }
  }

  // home to defend
  ctx.fillStyle = "#7f5136";
  ctx.fillRect(WORLD.width / 2 - 48, WORLD.height / 2 - 110, 96, 64);
  ctx.fillStyle = "#4b2f1d";
  ctx.beginPath();
  ctx.moveTo(WORLD.width / 2 - 56, WORLD.height / 2 - 110);
  ctx.lineTo(WORLD.width / 2, WORLD.height / 2 - 146);
  ctx.lineTo(WORLD.width / 2 + 56, WORLD.height / 2 - 110);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);

  const flashing = p.invulnMs > 0 && Math.floor(p.invulnMs / 35) % 2 === 0;
  ctx.fillStyle = flashing ? "#ffffb4" : "#f8f0d0";

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();

  // direction marker (headband)
  ctx.strokeStyle = "#1b1f22";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(p.facingX * (p.radius + 8), p.facingY * (p.radius + 8));
  ctx.stroke();

  if (state.swordSwingTimer > 0) {
    ctx.strokeStyle = "#d9dde2";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 42, -0.8, 0.8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemies() {
  for (const e of state.enemies) {
    ctx.fillStyle = "#a33c31";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2f1312";
    ctx.fillRect(e.x - 5, e.y - 1, 10, 2);
  }
}

function drawProjectiles() {
  for (const p of state.projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = "#d9dadb";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawWaveBanner() {
  if (!state.running) return;

  ctx.fillStyle = "rgba(14, 20, 12, 0.35)";
  ctx.fillRect(WORLD.width / 2 - 78, 10, 156, 36);
  ctx.fillStyle = "#ecf2de";
  ctx.font = "bold 18px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(`Wave ${state.wave}`, WORLD.width / 2, 34);
}

function render() {
  drawBackground();
  drawProjectiles();
  drawEnemies();
  drawPlayer();
  drawWaveBanner();
}

function gameLoop(timestamp) {
  if (!state.lastTimestamp) state.lastTimestamp = timestamp;
  const dtMs = Math.min(40, timestamp - state.lastTimestamp);
  state.lastTimestamp = timestamp;

  if (state.running) {
    applyInput(dtMs / 1000);

    state.player.invulnMs = Math.max(0, state.player.invulnMs - dtMs);
    state.swordSwingTimer = Math.max(0, state.swordSwingTimer - dtMs);

    updateSpawning(dtMs);
    updateProjectiles(dtMs);
    updateEnemies(dtMs);
    maybeAdvanceWave();
  }

  render();
  requestAnimationFrame(gameLoop);
}

function bindKeyboard() {
  const map = {
    w: "up",
    arrowup: "up",
    s: "down",
    arrowdown: "down",
    a: "left",
    arrowleft: "left",
    d: "right",
    arrowright: "right",
  };

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (map[key]) {
      state.input[map[key]] = true;
      e.preventDefault();
      return;
    }

    if (key === " " || key === "spacebar") {
      swingSword();
      e.preventDefault();
      return;
    }

    if (key === "f") {
      throwShuriken();
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (map[key]) {
      state.input[map[key]] = false;
      e.preventDefault();
    }
  });
}

function bindPointer() {
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WORLD.width;
    const py = ((e.clientY - rect.top) / rect.height) * WORLD.height;
    const dx = px - state.player.x;
    const dy = py - state.player.y;
    const len = Math.hypot(dx, dy) || 1;
    state.player.facingX = dx / len;
    state.player.facingY = dy / len;
    throwShuriken();
  });
}

function bindMobileControls() {
  const dirFromButton = {
    up: "up",
    down: "down",
    left: "left",
    right: "right",
  };

  dpad.querySelectorAll("button[data-dir]").forEach((button) => {
    const dir = dirFromButton[button.dataset.dir];

    const press = (event) => {
      event.preventDefault();
      state.input[dir] = true;
    };
    const release = (event) => {
      event.preventDefault();
      state.input[dir] = false;
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  });

  swordBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    swingSword();
  });

  shurikenBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    throwShuriken();
  });
}

startBtn.addEventListener("click", () => {
  resetGame();
});

bindKeyboard();
bindPointer();
bindMobileControls();
updateHud();
render();
requestAnimationFrame(gameLoop);
