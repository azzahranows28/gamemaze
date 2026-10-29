const mazeElement = document.getElementById('maze');
const timerElement = document.getElementById('timer');
const movesElement = document.getElementById('moves');
const levelElement = document.getElementById('level');
const messageElement = document.getElementById('message');
const nextLevelButton = document.getElementById('next-level');
const keyStatusElement = document.getElementById('key-status');
const pauseButton = document.getElementById('pause');
const pauseOverlay = document.getElementById('pause-overlay');
const resumeButton = document.getElementById('resume');

let level = 1;
let rows = 15;
let cols = 21;
const start = { row: 1, col: 1 };
let exit = { row: rows - 2, col: cols - 2 };
const directions = [
  { row: -2, col: 0 },
  { row: 2, col: 0 },
  { row: 0, col: -2 },
  { row: 0, col: 2 }
];

let maze;
let player;
let keyPosition;
let hasKey;
let moves;
let seconds;
let finished;
let paused;
let timerId;

function createMaze() {
  maze = Array.from({ length: rows }, () => Array(cols).fill(1));
  const stack = [{ ...start }];
  maze[start.row][start.col] = 0;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = directions
      .map(direction => ({ row: current.row + direction.row, col: current.col + direction.col }))
      .filter(next => next.row > 0 && next.row < rows - 1 && next.col > 0 && next.col < cols - 1 && maze[next.row][next.col] === 1);

    if (!options.length) {
      stack.pop();
      continue;
    }

    const next = options[Math.floor(Math.random() * options.length)];
    maze[(current.row + next.row) / 2][(current.col + next.col) / 2] = 0;
    maze[next.row][next.col] = 0;
    stack.push(next);
  }

  const keySpots = [];
  for (let row = 1; row < rows - 1; row += 1) {
    for (let col = 1; col < cols - 1; col += 1) {
      if (maze[row][col] === 0 && !(row === start.row && col === start.col) && !(row === exit.row && col === exit.col)) {
        keySpots.push({ row, col });
      }
    }
  }
  keyPosition = keySpots[Math.floor(Math.random() * keySpots.length)];
}

function renderMaze() {
  mazeElement.style.setProperty('--cols', cols);
  mazeElement.style.setProperty('--rows', rows);
  mazeElement.innerHTML = '';

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement('div');
      cell.className = `cell ${maze[row][col] ? 'wall' : 'path'}`;
      cell.setAttribute('role', 'gridcell');
      if (row === exit.row && col === exit.col) {
        cell.classList.add('exit');
        if (!hasKey) cell.classList.add('locked');
      }
      if (!hasKey && row === keyPosition.row && col === keyPosition.col) cell.classList.add('key');
      if (row === player.row && col === player.col) cell.classList.add('player');
      mazeElement.appendChild(cell);
    }
  }
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = (value % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

function startGame() {
  clearInterval(timerId);
  rows = Math.min(15 + (level - 1) * 2, 31);
  cols = Math.min(21 + (level - 1) * 2, 41);
  exit = { row: rows - 2, col: cols - 2 };
  levelElement.textContent = level;
  nextLevelButton.hidden = true;
  createMaze();
  player = { ...start };
  hasKey = false;
  moves = 0;
  seconds = 0;
  finished = false;
  paused = false;
  pauseButton.setAttribute('aria-pressed', 'false');
  pauseButton.innerHTML = '⏸ <span>Jeda</span>';
  pauseOverlay.hidden = true;
  keyStatusElement.textContent = '🔒';
  keyStatusElement.setAttribute('aria-label', 'Kunci belum ditemukan');
  timerElement.textContent = '00:00';
  movesElement.textContent = '0';
  messageElement.textContent = 'Cari 🗝️ untuk membuka pintu. Gunakan panah atau WASD.';
  messageElement.classList.remove('won');
  renderMaze();
  timerId = setInterval(() => {
    if (!finished && !paused) {
      seconds += 1;
      timerElement.textContent = formatTime(seconds);
    }
  }, 1000);
}

function togglePause() {
  if (finished) return;
  paused = !paused;
  pauseOverlay.hidden = !paused;
  pauseButton.setAttribute('aria-pressed', String(paused));
  pauseButton.innerHTML = paused ? '▶ <span>Lanjut</span>' : '⏸ <span>Jeda</span>';
  messageElement.textContent = paused ? 'Permainan dijeda.' : (hasKey ? 'Kuncinya sudah didapat! Cari pintu keluar.' : 'Cari 🗝️ untuk membuka pintu.');
}

function movePlayer(rowChange, colChange) {
  if (finished || paused) return;
  const nextRow = player.row + rowChange;
  const nextCol = player.col + colChange;
  if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols || maze[nextRow][nextCol] === 1) return;
  if (nextRow === exit.row && nextCol === exit.col && !hasKey) {
    messageElement.textContent = 'Pintu terkunci! Temukan kunci 🗝️ terlebih dahulu.';
    return;
  }

  player = { row: nextRow, col: nextCol };
  moves += 1;
  movesElement.textContent = moves;

  if (!hasKey && player.row === keyPosition.row && player.col === keyPosition.col) {
    hasKey = true;
    keyStatusElement.textContent = '🔑';
    keyStatusElement.setAttribute('aria-label', 'Kunci sudah ditemukan');
    messageElement.textContent = 'Kunci ditemukan! Sekarang cari pintu keluar 🚪.';
  }

  if (player.row === exit.row && player.col === exit.col) {
    finished = true;
    messageElement.textContent = `Level ${level} selesai dalam ${formatTime(seconds)} dan ${moves} langkah! 🎉`;
    messageElement.classList.add('won');
    nextLevelButton.hidden = false;
  }
  renderMaze();
}

document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (key === 'p' || key === 'escape') {
    event.preventDefault();
    togglePause();
    return;
  }
  const controls = {
    arrowup: [-1, 0], w: [-1, 0],
    arrowdown: [1, 0], s: [1, 0],
    arrowleft: [0, -1], a: [0, -1],
    arrowright: [0, 1], d: [0, 1]
  };
  if (controls[key]) {
    event.preventDefault();
    movePlayer(...controls[key]);
  }
});

document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('click', () => {
    const directionsByName = {
      up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1]
    };
    movePlayer(...directionsByName[button.dataset.direction]);
  });
});

document.getElementById('restart').addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);
nextLevelButton.addEventListener('click', () => {
  level += 1;
  startGame();
});
startGame();
